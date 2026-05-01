from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    phone_number = fields.Str(required=False)
    password = fields.Str(required=True, validate=validate.Length(min=8, error='Password must be at least 8 characters'))
    full_name = fields.Str(required=True, validate=validate.Length(min=2, max=255))


class LoginSchema(Schema):
    email = fields.Email(required=False)
    phone_number = fields.Str(required=False)
    password = fields.Str(required=True)
