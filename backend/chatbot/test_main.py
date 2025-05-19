import pytest
import json
from backend.chatbot.main import load_config, classify_intent, get_response, handle_message

def test_load_config_success(tmp_path):
    config_data = {"greet": "Hi"}
    config_file = tmp_path / "config.json"
    config_file.write_text(json.dumps(config_data))
    assert load_config(str(config_file)) == config_data

def test_load_config_file_not_found(tmp_path):
    missing = tmp_path / "does_not_exist.json"
    with pytest.raises(FileNotFoundError):
        load_config(str(missing))

def test_load_config_invalid_json(tmp_path):
    bad_file = tmp_path / "config.json"
    bad_file.write_text("not a valid json")
    with pytest.raises(json.JSONDecodeError):
        load_config(str(bad_file))

@pytest.mark.parametrize("message, expected_intent", [
    ("hello there", "greeting"),
    ("HELLO WORLD", "greeting"),
    ("bye now", "goodbye"),
    ("this is random", "unknown"),
])
def test_classify_intent(message, expected_intent):
    assert classify_intent(message) == expected_intent

@pytest.mark.parametrize("intent, expected_response", [
    ("greeting", "Hi there!"),
    ("goodbye", "Goodbye!"),
    ("unknown", "I didn't understand that."),
])
def test_get_response(intent, expected_response):
    assert get_response(intent) == expected_response

def test_handle_message_end_to_end():
    # greeting path
    assert handle_message("hello friend", {}) == "Hi there!"
    # goodbye path
    assert handle_message("bye bye", {}) == "Goodbye!"
    # unknown path
    assert handle_message("how are you?", {}) == "I didn't understand that."