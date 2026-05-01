from marshmallow import Schema, fields, validate


class ActivityCreateSchema(Schema):
    action_text = fields.Str(required=True, validate=validate.Length(min=3, max=255))
    icon = fields.Str(load_default='info')
    color = fields.Str(load_default='blue')
