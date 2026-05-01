def validate_request(schema_class, data):
    """Validate data with marshmallow schema. Returns (parsed, errors)."""
    schema = schema_class()
    errors = schema.validate(data)
    if errors:
        return None, errors
    return schema.load(data), None
