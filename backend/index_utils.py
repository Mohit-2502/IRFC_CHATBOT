import os
import json
import hashlib
from datetime import datetime
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, load_index_from_storage, Document
from llama_index.core.node_parser import SentenceSplitter
from llama_parse import LlamaParse # Keep for type hinting if needed, actual parser object from common_settings
from common_settings import NODE_PARSER # Import default node parser

def get_file_metadata(file_path):
    """Generates a hash and modification time for a file."""
    hasher = hashlib.md5()
    try:
        with open(file_path, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest(), os.path.getmtime(file_path)
    except IOError:
        return None, None

def manage_index(
    index_name: str,
    persist_dir: str,
    data_dir: str,
    doc_parser_instance: LlamaParse = None, # Expecting the initialized LlamaParse object
    force_rebuild: bool = False,
    node_parser_for_build: SentenceSplitter = NODE_PARSER # Use default from common_settings
) -> VectorStoreIndex | None:
    """
    Manages a VectorStoreIndex: loads if exists, updates with new files, or builds if new.
    Tracks processed files using a metadata file to avoid re-processing.
    Uses an explicit node_parser when building the index.
    """
    os.makedirs(persist_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    metadata_path = os.path.join(persist_dir, "index_metadata.json")
    processed_files_metadata = {}

    index = None

    if os.path.exists(metadata_path) and not force_rebuild:
        print(f"Loading metadata for index '{index_name}' from {metadata_path}")
        with open(metadata_path, 'r') as f:
            processed_files_metadata = json.load(f).get("processed_files", {})

    if os.path.exists(os.path.join(persist_dir, "docstore.json")) and not force_rebuild:
        print(f"Loading existing index '{index_name}' from {persist_dir}...")
        try:
            storage_context = StorageContext.from_defaults(persist_dir=persist_dir)
            index = load_index_from_storage(storage_context)
            print(f"Index '{index_name}' loaded successfully.")
        except Exception as e:
            print(f"Error loading index '{index_name}' from storage: {e}. Will attempt to rebuild.")
            index = None
            processed_files_metadata = {}
    else:
        if force_rebuild:
            print(f"Force rebuilding index '{index_name}'.")
        else:
            print(f"No existing index found for '{index_name}' at {persist_dir}. Will build new one.")
        processed_files_metadata = {}

    current_files_in_data_dir = [f for f in os.listdir(data_dir) if os.path.isfile(os.path.join(data_dir, f))]
    new_or_modified_files_to_process = []
    all_docs_for_new_index = []

    print(f"Scanning data directory: {data_dir} for index '{index_name}'...")
    for filename in current_files_in_data_dir:
        file_path = os.path.join(data_dir, filename)
        file_hash, file_mtime = get_file_metadata(file_path)

        if not file_hash:
            continue

        is_new = filename not in processed_files_metadata
        is_modified = not is_new and (
            processed_files_metadata[filename]['hash'] != file_hash or
            processed_files_metadata[filename]['mtime'] != file_mtime
        )

        if is_new or is_modified or force_rebuild:
            if is_modified: print(f"File '{filename}' has been modified. Will re-process.")
            elif is_new: print(f"New file '{filename}' found. Will process.")
            new_or_modified_files_to_process.append(file_path)

        if index is None or force_rebuild:
             all_docs_for_new_index.append(file_path)

    documents_to_add_as_llama_docs = []
    files_for_current_processing_run = all_docs_for_new_index if (index is None or force_rebuild) else new_or_modified_files_to_process

    if not files_for_current_processing_run and index:
        print(f"No new or modified files to process for index '{index_name}'. Index is up-to-date.")
    elif not files_for_current_processing_run and not index:
         print(f"No files found in {data_dir} to build index '{index_name}'.")
         return None

    for file_path in files_for_current_processing_run:
        filename = os.path.basename(file_path)
        print(f"Processing file: {file_path} for index '{index_name}'")
        try:
            loaded_llama_docs_from_file = []
            if filename.lower().endswith(".pdf") and doc_parser_instance:
                print(f"Using LlamaParse for PDF: {filename}")
                loaded_llama_docs_from_file = doc_parser_instance.load_data(file_path)
            else:
                if filename.lower().endswith(".pdf"):
                    print(f"Warning: LlamaParse not used for PDF '{filename}'. Using SimpleDirectoryReader.")
                reader = SimpleDirectoryReader(input_files=[file_path])
                loaded_llama_docs_from_file = reader.load_data()

            if loaded_llama_docs_from_file:
                documents_to_add_as_llama_docs.extend(loaded_llama_docs_from_file)
                file_hash, file_mtime = get_file_metadata(file_path)
                if file_hash:
                    processed_files_metadata[filename] = {'hash': file_hash, 'mtime': file_mtime, 'processed_at': str(datetime.now())}
            else:
                print(f"Warning: No content loaded from file: {filename}")

        except Exception as e:
            print(f"Error processing file {filename}: {e}")
            if filename in processed_files_metadata:
                del processed_files_metadata[filename]

    if not documents_to_add_as_llama_docs and index:
        print(f"Index '{index_name}' is loaded and no new valid documents were added in this run.")
    elif not documents_to_add_as_llama_docs and not index:
        print(f"No valid LlamaIndex Documents found to build or update index '{index_name}'.")
        if os.path.exists(metadata_path):
            try: os.remove(metadata_path)
            except: pass
        return None

    if index is None or force_rebuild:
        if documents_to_add_as_llama_docs:
            print(f"Building new VectorStoreIndex for '{index_name}' from {len(documents_to_add_as_llama_docs)} Document object(s)...")
            index = VectorStoreIndex.from_documents(
                documents_to_add_as_llama_docs,
                transformations=[node_parser_for_build],
                show_progress=True
            )
            print(f"Persisting new index '{index_name}' to {persist_dir}...")
            index.storage_context.persist(persist_dir=persist_dir)
            print("Index persisted.")
        else:
            print(f"No documents to build new index '{index_name}'.")
            return None
    elif documents_to_add_as_llama_docs:
        print(f"Updating existing index '{index_name}' with {len(documents_to_add_as_llama_docs)} new Document object(s)...")
        new_nodes = node_parser_for_build.get_nodes_from_documents(documents_to_add_as_llama_docs)
        index.insert_nodes(new_nodes, show_progress=True)
        print(f"Persisting updated index '{index_name}' to {persist_dir}...")
        index.storage_context.persist(persist_dir=persist_dir)
        print("Index updates persisted.")

    if processed_files_metadata:
        print(f"Saving updated metadata for index '{index_name}' to {metadata_path}")
        with open(metadata_path, 'w') as f:
            json.dump({"processed_files": processed_files_metadata, "last_updated": str(datetime.now())}, f, indent=4)

    if index:
        print(f"Index '{index_name}' is ready.")
    else:
        print(f"Failed to load or build index '{index_name}'.")
    return index