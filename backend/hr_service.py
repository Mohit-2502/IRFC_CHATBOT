import os
import nest_asyncio
from flask import Flask, request, jsonify
from typing import Dict, List, Tuple

# Import shared settings and utilities
from common_settings import LLM, PDF_PARSER, NODE_PARSER, Settings # PDF_PARSER might be None
from index_utils import manage_index #
from llama_index.core.query_engine import BaseQueryEngine, RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever, QueryFusionRetriever
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core import ServiceContext # For older LlamaIndex versions, or use Settings

nest_asyncio.apply()

# --- HR Service Specific Configuration ---
HR_DATA_DIR = "../data/hr/"
HR_PERSIST_DIR = "../storage/hr_index"
HR_INDEX_NAME = "HR_Policy_Service"
HR_TOOL_NAME = "hr_documents"
HR_TOOL_DESCRIPTION = "Human Resources policies, employee benefits, leave procedures, official HR forms, and other general HR matters."
SIMILARITY_K = 7 # You can tune this: higher K means more documents, potentially more noise.

# --- Initialize HR Index and Query Engine ---
print(f"--- Initializing HR Index for {HR_INDEX_NAME} ---")
hr_index = manage_index(
    HR_INDEX_NAME,
    HR_PERSIST_DIR,
    HR_DATA_DIR,
    doc_parser_instance=PDF_PARSER,
    node_parser_for_build=NODE_PARSER #
)

hr_query_engine = None
if hr_index:
    # --- MODIFIED SECTION FOR HYBRID SEARCH ---
    print(f"Initializing Hybrid Query Engine for {HR_INDEX_NAME}...")

    # 1. Access nodes for BM25 from the existing index's docstore
    # This assumes manage_index has populated the docstore
    try:
        nodes_for_bm25 = list(hr_index.docstore.docs.values())
        if not nodes_for_bm25:
            print("Warning: No nodes found in hr_index.docstore. BM25Retriever might be ineffective.")
            # Fallback to default vector search if nodes are not available for BM25
            hr_query_engine = hr_index.as_query_engine(similarity_top_k=SIMILARITY_K, llm=LLM) #
            print(f"HR Query Engine (Fell back to Default Vector Search due to no nodes for BM25) for {HR_INDEX_NAME} initialized.") #
        else:
            print(f"Successfully retrieved {len(nodes_for_bm25)} nodes for BM25 retriever from hr_index.docstore.")

            # 2. Create individual retrievers
            vector_retriever = VectorIndexRetriever(
                index=hr_index,
                similarity_top_k=SIMILARITY_K,
            )
            bm25_retriever = BM25Retriever.from_defaults(
                nodes=nodes_for_bm25,
                similarity_top_k=SIMILARITY_K
            )

            # 3. Create QueryFusionRetriever
            query_fusion_retriever = QueryFusionRetriever(
                retrievers=[vector_retriever, bm25_retriever],
                similarity_top_k=SIMILARITY_K, # Top k results after fusion
                num_queries=4,  # Number of queries to generate for fusion (Reasonable default)
                mode="reciprocal_rerank", # Common fusion mode
                use_async=False, # Set to True if your LLM setup supports async for this
                llm=LLM, # Pass the LLM for query generation
            )

            # 4. Create Query Engine from the new retriever
            # For LlamaIndex versions that rely on global Settings for llm, embed_model etc.
            # this is simpler. If using older versions with ServiceContext explicitly:
            # service_context_for_engine = ServiceContext.from_defaults(llm=LLM, embed_model=Settings.embed_model, node_parser=NODE_PARSER)
            # hr_query_engine = RetrieverQueryEngine.from_args(query_fusion_retriever, service_context=service_context_for_engine)
            
            # Simpler way relying on global Settings from common_settings.py
            hr_query_engine = RetrieverQueryEngine.from_args(query_fusion_retriever)


            print(f"HR Query Engine (Hybrid - QueryFusion) for {HR_INDEX_NAME} initialized.")

    except Exception as e:
        print(f"Error initializing Hybrid Query Engine for {HR_INDEX_NAME}: {e}. Falling back to default vector search.")
        hr_query_engine = hr_index.as_query_engine(similarity_top_k=SIMILARITY_K, llm=LLM) #
        print(f"HR Query Engine (Default Vector Search after error) for {HR_INDEX_NAME} initialized.") #

else:
    print(f"CRITICAL: HR index for {HR_INDEX_NAME} could not be initialized. HR service will not be functional.")
    # In a real scenario, you might exit or have a fallback mechanism.

# --- Simplified ReActAgent for HR (Stateless per request) ---
class ReActAgentHR: #
    def __init__(self, query_engine: BaseQueryEngine, llm, tool_name: str, tool_description: str,
                 system_prompt="You are a helpful HR assistant. Use the context from HR documents to answer the question accurately.",
                 verbose: bool = False): #
        if query_engine is None:
            raise ValueError("Query engine must be provided and initialized for ReActAgentHR.")
        self.query_engine = query_engine
        self.llm = llm
        self.system_prompt = system_prompt # Simplified system prompt
        self.verbose = verbose
        self.tool_name = tool_name
        self.tool_description = tool_description
        if self.verbose: print(f"ReActAgent for {self.tool_name} initialized. Verbose: {self.verbose}")

    def _think(self, user_input: str) -> str: #
        thought = f"HR Agent Thought: User asked: '{user_input}'. Formulating query for {self.tool_name} based on this input." #
        if self.verbose: print(thought)
        return thought

    def _get_refined_tool_query(self, user_input: str) -> str: #
        """
        Refines the user input into a more effective search query for the HR document tool.
        """
        prompt = (
            f"You are an expert at reformulating user questions into effective search queries for an HR document database.\n"
            f"The HR documents cover: {self.tool_description}.\n\n"
            f"User's current question: \"{user_input}\"\n\n"
            f"Analyze the user's question and generate the most effective and specific search query to retrieve relevant information from the HR documents. "
            f"Focus on extracting key entities, policy names, HR terms (e.g., 'leave', 'benefits', 'onboarding', 'grievance'), employee levels, or specific document types (e.g., 'form', 'policy', 'procedure').\n"
            f"For example, if the user asks 'How do I apply for sick leave?', a good refined query might be 'sick leave application procedure policy'.\n"
            f"If the user asks 'What are the dental benefits for senior staff?', a good refined query might be 'dental benefits senior staff employee'.\n"
            f"If the user asks 'Where is the form for travel reimbursement?', a good refined query might be 'travel reimbursement form'.\n"
            f"Provide ONLY the refined search query and nothing else. Do not add any introductory phrases like 'Here is the refined query:'."
        ) #
        response_object = self.llm.complete(prompt)
        refined_query = user_input # Fallback to original input

        if hasattr(response_object, 'text') and response_object.text.strip():
            refined_query = response_object.text.strip()
        elif isinstance(response_object, str) and response_object.strip():
            refined_query = response_object.strip()
        
        # Clean up potential LLM artifacts if it doesn't follow "ONLY the query" instruction perfectly
        refined_query = refined_query.replace("Refined search query:", "").replace("Tool Query:", "").strip() #
        if refined_query.startswith('"') and refined_query.endswith('"'):
            refined_query = refined_query[1:-1]


        if self.verbose: print(f"Refined query for '{self.tool_name}': '{refined_query}'.") #
        return refined_query

    def _use_tool(self, tool_query: str) -> Tuple[str, List[str]]: #
        if self.verbose: print(f"HR Agent: Using tool '{self.tool_name}' with query: {tool_query}") #
        tool_response = self.query_engine.query(tool_query)
        
        relevant_texts = []
        source_identifiers = [] # To store metadata like file names or node IDs
        if hasattr(tool_response, 'source_nodes'):
            for node_with_score in tool_response.source_nodes:
                if hasattr(node_with_score, 'node') and hasattr(node_with_score.node, 'get_content'):
                    relevant_texts.append(str(node_with_score.node.get_content()))
                    # Attempt to get meaningful source identifiers
                    node_id = getattr(node_with_score.node, 'node_id', getattr(node_with_score.node, 'id_', "Unknown Node")) #
                    file_name = getattr(node_with_score.node, 'metadata', {}).get('file_name', "Unknown File") #
                    source_identifiers.append(f"Node: {node_id} (Source: {file_name})") #

        tool_finding_summary = "\n---\n".join(relevant_texts) if relevant_texts else "No information found by the tool for the query." #
        if self.verbose: print(f"HR Tool Findings Summary (first 200 chars): {tool_finding_summary[:200]}...") #
        return tool_finding_summary, list(set(source_identifiers)) # Unique source identifiers

    def _llm_answer(self, user_input: str, tool_context: str, source_identifiers: List[str], initial_thought: str) -> str: #
        sources_str = "\n".join(source_identifiers) if source_identifiers else "No specific sources identified." #
        prompt = (
            f"{self.system_prompt}\n\n"
            f"User's Original Question: {user_input}\n\n"
            f"Context retrieved from HR documents ({self.tool_name}):\n"
            f"---------------------------------------------------\n"
            f"{tool_context}\n"
            f"---------------------------------------------------\n"
            # f"Sources of Information:\n{sources_str}\n\n" # You can include sources in the prompt if you want the LLM to mention them
            f"Based *solely* on the provided HR document context above, answer the user's original question. "
            f"If the context does not contain the answer, clearly state that the information was not found in the documents. "
            f"Do not use any prior knowledge outside of the provided context. Be concise and direct.\nAnswer:"
        ) #
        response_object = self.llm.complete(prompt)
        final_answer = "Could not generate HR answer based on the provided documents." #
        if hasattr(response_object, 'text'): final_answer = response_object.text.strip() #
        elif isinstance(response_object, str): final_answer = response_object.strip() #
        
        if self.verbose: print(f"HR LLM Synthesized Answer: {final_answer}") #
        # Optionally append source info to the final answer if needed by the application
        # if source_identifiers:
        #     final_answer += f"\n\n(Information based on: {', '.join(list(set(s.split(' (Source: ')[1][:-1] if ' (Source: ' in s else s for s in source_identifiers)))}) )"

        return final_answer

    def chat(self, user_input: str) -> str: #
        thinking_step_log = self._think(user_input) #
        
        refined_tool_query = self._get_refined_tool_query(user_input) #
        tool_result_text, source_identifiers = self._use_tool(refined_tool_query) #
        final_llm_response_text = self._llm_answer(user_input, tool_result_text, source_identifiers, thinking_step_log) #
        
        return final_llm_response_text

# --- HR Service Class (No changes needed here if agent is stateless) ---
class HRService: #
    def __init__(self): #
        if hr_query_engine is None:
            raise ValueError("HR Query Engine is not initialized. Cannot create HRService.")
        self.agent = ReActAgentHR(
            query_engine=hr_query_engine,
            llm=LLM, #
            tool_name=HR_TOOL_NAME,
            tool_description=HR_TOOL_DESCRIPTION,
            verbose=True 
        ) #

    def process_query(self, query: str) -> str: #
        try:
            return self.agent.chat(query) #
        except Exception as e:
            print(f"Error processing HR query: {str(e)}")
            return f"Sorry, I encountered an error while processing your HR query: {str(e)}"

# --- Flask App for HR Service ---
# This part is typically in your main app.py, but included if hr_service.py is run directly
# For the main app.py structure you provided, this Flask app instance here isn't strictly necessary
# if hr_service_instance is instantiated and used in the main app.py.
# However, if hr_service.py is meant to be runnable on its own for testing this service, it's fine.

_app_hr_service_local = Flask(__name__) # Renamed to avoid conflict if imported

hr_service_instance = None
if hr_query_engine: # Check if engine is available before creating service
    hr_service_instance = HRService() #
else:
    print("HR Service instance could not be created because HR query engine failed to load.") #

@_app_hr_service_local.route('/chat/hr', methods=['POST']) # Using the local app instance
def chat_hr_local(): # Renamed endpoint function
    if not hr_service_instance:
        return jsonify({"error": "HR Chatbot service is not available due to an initialization issue."}), 503 #

    data = request.json
    user_input = data.get('user_input') #

    if not user_input:
        return jsonify({"error": "user_input is required"}), 400 #

    # No history is passed to the agent's chat method anymore
    response = hr_service_instance.process_query(user_input)  #
    return jsonify({"response": response}) #

if __name__ == '__main__':
    if hr_service_instance: # Check if the service instance is ready
        print("HR Service Ready: Running Flask app on port 5001 (hr_service.py direct run)")
        _app_hr_service_local.run(host='0.0.0.0', port=5001, debug=False)
    else:
        print("HR Service cannot start as the service instance is not initialized (likely due to query engine failure).") #