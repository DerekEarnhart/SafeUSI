from flask import Flask, request, jsonify
# Import modules from project structure
from core_engine.quantum_harmonic_processor import QuantumHarmonicProcessor
from nlp.language_interface import LanguageInterface

app = Flask(__name__)

# Initialize components
processor = QuantumHarmonicProcessor()
nlp = LanguageInterface()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    text = data.get('message', '')
    intent = nlp.parse(text)
    tokens = nlp.tokenize(text)
    vectors = processor.process_tokens(tokens)
    response = nlp.generate_response(intent, vectors)
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
