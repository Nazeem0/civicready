from marshmallow import Schema, fields, validate


class CompleteModuleSchema(Schema):
    score = fields.Int(required=True, validate=validate.Range(min=0, max=100))
