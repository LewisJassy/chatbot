# The following tests use pytest as the testing framework
import pytest
from unittest.mock import MagicMock
from backend.chatbot.chat_router import ChatRouter

@pytest.fixture
def mock_service():
    svc = MagicMock()
    svc.start_session.return_value = "session started"
    svc.process_message.return_value = "processed!"
    return svc

@pytest.fixture
def router(mock_service):
    return ChatRouter(mock_service)

def test_route_help_shows_usage(router):
    response = router.route("/help")
    assert isinstance(response, str)
    assert "Usage" in response

def test_route_start_delegates_to_start_session(router, mock_service):
    msg = "/start session123"
    mock_service.start_session.return_value = "session started"
    result = router.route(msg)
    assert result == "session started"
    mock_service.start_session.assert_called_once_with(msg)

def test_route_noncommand_delegates_to_process_message(router, mock_service):
    msg = "hello there"
    mock_service.process_message.return_value = "processed!"
    result = router.route(msg)
    assert result == "processed!"
    mock_service.process_message.assert_called_once_with(msg)

def test_route_empty_string_raises_value_error(router):
    with pytest.raises(ValueError):
        router.route("")

def test_route_none_message_raises_value_error(router):
    with pytest.raises(ValueError):
        router.route(None)

def test_help_text_direct_call(router):
    expected = router.help_text()
    assert "Usage" in expected