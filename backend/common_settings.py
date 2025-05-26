import os
from dotenv import load_dotenv
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_parse import LlamaParse

load_dotenv()

# --- Environment Variables & API Keys ---
API_KEY_LLAMA = os.getenv("CLOUD_API_KEY")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GOOGLE_API_KEY for Gemini is missing in the environment variables!")

# --- LlamaIndex Basic Configuration ---
LLM = GoogleGenAI(model="gemini-2.0-flash")
EMBED_MODEL = HuggingFaceEmbedding(model_name="BAAI/bge-large-en-v1.5")
NODE_PARSER = SentenceSplitter(chunk_size=768, chunk_overlap=250)

Settings.llm = LLM
Settings.embed_model = EMBED_MODEL
Settings.node_parser = NODE_PARSER # Global default, can be overridden
Settings.num_workers = 0

# Initialize LlamaParse
PDF_PARSER = None
if API_KEY_LLAMA:
    try:
        PDF_PARSER = LlamaParse(api_key=API_KEY_LLAMA, result_type="markdown", verbose=True)
        print("LlamaParse initialized successfully in common_settings.")
    except Exception as e:
        print(f"Warning: Failed to initialize LlamaParse in common_settings: {e}.")
        PDF_PARSER = None
else:
    print("Warning: CLOUD_API_KEY for LlamaParse not found in common_settings.")