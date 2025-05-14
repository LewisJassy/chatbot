import spacy

# Load the spaCy model
nlp = spacy.load("en_core_web_sm")


def preprocess_text(text):
    """
    Preprocess the input text using spaCy.
    This function tokenizes the text, removes stop words and punctuation, and lemmatizes the tokens.
    """
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if not token.is_stop and not token.is_punct]
    return " ".join(tokens)