import os
class PromptLoader:
    def __init__(self, prompt_dir=None):
        """
        Initialize loader; if prompt_dir is None, use the directory of this file
        """
        # Determine prompts directory: use provided path or this file's folder
        if prompt_dir:
            self.prompts_dir = prompt_dir
        else:
            self.prompts_dir = os.path.dirname(__file__)
        self.prompts_cache = {}
    
    def load_prompts(self, prompt_name):
        """Load a prompt with caching"""
        if prompt_name in self.prompts_cache:
            return self.prompts_cache[prompt_name]
        
        file_path = os.path.join(self.prompts_dir, f"{prompt_name}.txt")
        try:
            with open(file_path, 'r') as f:
                prompt = f.read().strip()
                self.prompts_cache[prompt_name] = prompt
                return prompt
        except FileNotFoundError:
            raise ValueError(f"Prompt '{prompt_name}' not found")
    
    def get_available_prompts(self):
        """List all available prompts options"""
        return [f.replace('.txt', '') for f in os.listdir(self.prompts_dir) if f.endswith('.txt')]
