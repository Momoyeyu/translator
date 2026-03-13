from llm.service import LLMProfile, LLMService


def test_llm_profile_enum():
    assert LLMProfile.DEFAULT == "default"
    assert LLMProfile.FAST == "fast"
    assert LLMProfile.PRO == "pro"


def test_get_model_name():
    service = LLMService(
        api_key="test-key",
        base_url="http://localhost",
        model_name="default-model",
        fast_model_name="fast-model",
        pro_model_name="pro-model",
    )
    assert service.get_model_name(LLMProfile.DEFAULT) == "default-model"
    assert service.get_model_name(LLMProfile.FAST) == "fast-model"
    assert service.get_model_name(LLMProfile.PRO) == "pro-model"


def test_fallback_to_default():
    service = LLMService(
        api_key="test-key",
        base_url="http://localhost",
        model_name="default-model",
        fast_model_name="",
        pro_model_name="",
    )
    assert service.get_model_name(LLMProfile.FAST) == "default-model"
    assert service.get_model_name(LLMProfile.PRO) == "default-model"
