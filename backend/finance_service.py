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
from llama_index.core import ServiceContext # For older LlamaIndex versions

nest_asyncio.apply()

# --- Finance Service Specific Configuration ---
FINANCE_DATA_DIR = "../data/financials/" #
FINANCE_PERSIST_DIR = "../storage/financials_index" #
FINANCE_INDEX_NAME = "Financial_Docs_Service" #
FINANCE_TOOL_NAME = "financial_reports" #
FINANCE_TOOL_DESCRIPTION = "Company financial reports, including balance sheets, profit and loss statements, cash flow statements, and other financial disclosures." #
SIMILARITY_K = 8 #

# --- Initialize Finance Index and Query Engine ---
print(f"--- Initializing Finance Index for {FINANCE_INDEX_NAME} ---") #
finance_index = manage_index(
    FINANCE_INDEX_NAME,
    FINANCE_PERSIST_DIR,
    FINANCE_DATA_DIR,
    doc_parser_instance=PDF_PARSER,
    node_parser_for_build=NODE_PARSER #
)

finance_query_engine = None
if finance_index:
    # --- MODIFIED SECTION FOR HYBRID SEARCH ---
    print(f"Initializing Hybrid Query Engine for {FINANCE_INDEX_NAME}...")

    try:
        # 1. Access nodes for BM25
        nodes_for_bm25 = list(finance_index.docstore.docs.values())
        if not nodes_for_bm25:
            print("Warning: No nodes found in finance_index.docstore. BM25Retriever might be ineffective.")
            # Fallback to default vector search
            finance_query_engine = finance_index.as_query_engine(similarity_top_k=SIMILARITY_K, llm=LLM) #
            print(f"Finance Query Engine (Fell back to Default Vector Search due to no nodes for BM25) for {FINANCE_INDEX_NAME} initialized.") #
        else:
            print(f"Successfully retrieved {len(nodes_for_bm25)} nodes for BM25 retriever from finance_index.docstore.")

            # 2. Create individual retrievers
            vector_retriever = VectorIndexRetriever(
                index=finance_index,
                similarity_top_k=SIMILARITY_K,
            )
            bm25_retriever = BM25Retriever.from_defaults(
                nodes=nodes_for_bm25,
                similarity_top_k=SIMILARITY_K
            )

            # 3. Create QueryFusionRetriever
            query_fusion_retriever = QueryFusionRetriever(
                retrievers=[vector_retriever, bm25_retriever],
                similarity_top_k=SIMILARITY_K,
                num_queries=4,
                mode="reciprocal_rerank",
                use_async=False,
                llm=LLM, #
            )
            
            # 4. Create Query Engine
            # Simpler way relying on global Settings
            finance_query_engine = RetrieverQueryEngine.from_args(query_fusion_retriever)
            
            print(f"Finance Query Engine (Hybrid - QueryFusion) for {FINANCE_INDEX_NAME} initialized.")

    except Exception as e:
        print(f"Error initializing Hybrid Query Engine for {FINANCE_INDEX_NAME}: {e}. Falling back to default.")
        finance_query_engine = finance_index.as_query_engine(similarity_top_k=SIMILARITY_K, llm=LLM) #
        print(f"Finance Query Engine (Default Vector Search after error) for {FINANCE_INDEX_NAME} initialized.") #

else:
    print(f"CRITICAL: Finance index for {FINANCE_INDEX_NAME} could not be initialized. Finance service will not be functional.") #

# --- Simplified ReActAgent for Finance ---
class ReActAgentFinance: #
    def __init__(self, query_engine: BaseQueryEngine, llm, tool_name: str, tool_description: str,
                 system_prompt="You are a helpful assistant specializing in Finance. Use the provided conversation history and context from financial documents to answer the question.",
                 verbose: bool = False): #
        if query_engine is None:
            raise ValueError("Query engine must be provided and initialized for ReActAgentFinance.")
        self.query_engine = query_engine
        self.llm = llm
        self.history = [] # For this simple API, history might be managed per request or session externally
        self.system_prompt = system_prompt
        self.verbose = verbose
        self.tool_name = tool_name
        self.tool_description = tool_description
        if self.verbose: print(f"ReActAgent for {self.tool_name} initialized. Verbose: {self.verbose}")

    def _format_history_for_prompt(self, current_history: List[Dict[str,str]]): # Accept history
        if not current_history:
            return "No conversation history provided for this request." #
        return "\n".join([f"{item['role'].capitalize()}: {item['content']}" for item in current_history]) #

    def _think(self, user_input: str, history_str: str) -> str: #
        thought = f"Finance Agent Thought: User asked: '{user_input}'. History: '{history_str.splitlines()[0] if history_str else 'None'}'. Formulating query for {self.tool_name}." #
        if self.verbose: print(thought)
        return thought

    def _get_contextual_tool_query(self, user_input: str, history_str: str) -> str: #
        prompt = (
            f"{self.system_prompt}\n\n"
            f"{history_str}\n\n"
            f"Current user question for Finance domain: {user_input}\n\n"
            f"Based on the conversation and the current question related to '{self.tool_description}', what is the most effective and specific query to use with the financial document search tool? "
            f"Consider financial terms, report names, fiscal periods, or specific financial metrics.\n"
            f"Provide only the best single Tool Query:"
        ) #
        response_object = self.llm.complete(prompt)
        refined_query = user_input # Fallback
        if hasattr(response_object, 'text'): refined_query = response_object.text.strip() #
        elif isinstance(response_object, str): refined_query = response_object.strip() #

        if self.verbose: print(f"Refined query for '{self.tool_name}': '{refined_query}'.") #
        return refined_query

    def _use_tool(self, tool_query: str) -> Tuple[str, List[str]]: #
        if self.verbose: print(f"Finance Agent: Using tool '{self.tool_name}' with query: {tool_query}") #
        tool_response = self.query_engine.query(tool_query)
        # (Parsing logic for tool_response as in the original _use_tool method)
        relevant_texts = []
        source_identifiers = []
        if hasattr(tool_response, 'source_nodes'):
            for node_with_score in tool_response.source_nodes:
                if hasattr(node_with_score, 'node') and hasattr(node_with_score.node, 'get_content'):
                    relevant_texts.append(str(node_with_score.node.get_content()))
                    node_id = getattr(node_with_score.node, 'node_id', getattr(node_with_score.node, 'id_', None)) #
                    if node_id: source_identifiers.append(str(node_id)) #
        tool_finding_summary = "\n---\n".join(relevant_texts) if relevant_texts else "No information found by the tool for the query." #
        if self.verbose: print(f"Finance Tool Findings Summary: {tool_finding_summary[:200]}...") #
        return tool_finding_summary, list(set(source_identifiers))

    def _llm_answer(self, user_input: str, history_str: str, tool_context: str, source_identifiers: List[str], initial_thought: str) -> str: #
        prompt = (
            f"{self.system_prompt}\n\n"
            f"{history_str}\n\n"
            f"Tool Context from {self.tool_name} documents:\n'''{tool_context}'''\n\n"
            f"IMPORTANT INSTRUCTION: When providing the answer, please ensure that all specific dates and units"
            f"(e.g., **March 15, 2023**, **Q4 2024**, **2023-12-31**) and monetary amounts "
            f"(e.g., **$1,234.56**, **€789 million**, **₹50,000 CR**, **USD 1.2B**, **₹50,000 crore**) are enclosed in double asterisks "
            f"to make them appear bold, like this: `**text_to_be_bold**`.\n\n" # MODIFIED LINE
            f"Original Question: {user_input}\n\n"
            f"Answer the question based on the financial context. If not found, say so.\nAnswer:"
        ) #
        response_object = self.llm.complete(prompt)
        final_answer = "Could not generate financial answer." #
        if hasattr(response_object, 'text'): final_answer = response_object.text.strip() #
        elif isinstance(response_object, str): final_answer = response_object.strip() #

        if self.verbose: print(f"Finance LLM Synthesized Answer: {final_answer}") #
        return final_answer

    def chat(self, user_input: str, current_request_history: List[Dict[str,str]] = None) -> str: #
        if current_request_history is None: current_request_history = [] #

        history_str = self._format_history_for_prompt(current_request_history) #
        thinking_step_log = self._think(user_input, history_str) #
        
        refined_tool_query = self._get_contextual_tool_query(user_input, history_str) #
        tool_result_text, source_identifiers = self._use_tool(refined_tool_query) #
        final_llm_response_text = self._llm_answer(user_input, history_str, tool_result_text, source_identifiers, thinking_step_log) #
        
        return final_llm_response_text

# --- Finance Service Class ---
class FinanceService: #
    def __init__(self): #
        if finance_query_engine is None:
            raise ValueError("Finance Query Engine is not initialized. Cannot create FinanceService.")
        self.agent = ReActAgentFinance(
            query_engine=finance_query_engine,
            llm=LLM, #
            tool_name=FINANCE_TOOL_NAME,
            tool_description=FINANCE_TOOL_DESCRIPTION,
            verbose=True
        ) #

    def process_query(self, query: str, history: List[Dict[str,str]] = None) -> str: # Added history to signature to match agent
        """
        Process a query through the Finance service.
        """
        try:
            # Pass history to the agent's chat method if it expects it
            return self.agent.chat(query, current_request_history=history or [])
        except Exception as e:
            print(f"Error processing Finance query: {str(e)}")
            return f"Sorry, I encountered an error while processing your Finance query: {str(e)}"


# --- Flask App for Finance Service (Local instance for direct run if needed) ---
_app_finance_service_local = Flask(__name__) # Renamed to avoid conflict

# Instantiate agent only if query engine is available
_finance_agent_local_instance = None # Renamed
if finance_query_engine:
    # This agent instance is for the local Flask app.
    # The FinanceService class creates its own agent instance.
    _finance_agent_local_instance = ReActAgentFinance(
        query_engine=finance_query_engine,
        llm=LLM, #
        tool_name=FINANCE_TOOL_NAME, #
        tool_description=FINANCE_TOOL_DESCRIPTION, #
        verbose=True # Set verbosity for the service
    ) #
else:
    print("Local Finance Agent instance for Flask app could not be initialized because Finance query engine failed to load.") #

@_app_finance_service_local.route('/chat/finance', methods=['POST']) # Using local app instance
def chat_finance_local(): # Renamed
    if not _finance_agent_local_instance: # Check local agent instance
        return jsonify({"error": "Finance Chatbot agent is not available."}), 503 #
        
    data = request.json
    user_input = data.get('user_input') #
    request_history = data.get('history', []) # Example of passing history

    if not user_input:
        return jsonify({"error": "user_input is required"}), 400 #

    response = _finance_agent_local_instance.chat(user_input, current_request_history=request_history) #
    return jsonify({"response": response}) #

if __name__ == '__main__':
    if _finance_agent_local_instance: # Check local agent instance
        print("Finance Service Ready: Running Flask app on port 5002 (finance_service.py direct run)")
        _app_finance_service_local.run(host='0.0.0.0', port=5002, debug=False)
    else:
        print("Finance Service (direct run) cannot start as the local agent is not initialized.") #