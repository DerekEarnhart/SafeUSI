def generate_image_stub(prompt: str) -> str:
    # In a real system, call your provider and return a URL/path.
    # MVP returns a placeholder image shipped in /static.
    return f"/static/placeholder.png?prompt={prompt}"
