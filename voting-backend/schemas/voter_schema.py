from marshmallow import Schema, fields, validate


class EligibilityCheckSchema(Schema):
    full_name = fields.Str(required=True, validate=validate.Length(min=2))
    dob = fields.Date(required=True)
    zip_code = fields.Str(required=True, validate=validate.Length(min=5, max=10))
    state = fields.Str(required=True)
    street_address = fields.Str(required=True)
    city = fields.Str(required=True)
    age = fields.Int(required=True)
    email = fields.Email(required=True)
    phone_number = fields.Str(required=True)
    father_name = fields.Str(required=True)
    mother_name = fields.Str(required=True)
    gender = fields.Str(required=True, validate=validate.OneOf(['Male', 'Female', 'Other', 'Prefer not to say']))
    occupation = fields.Str(required=True)


class UpdateProfileSchema(Schema):
    dob = fields.Date(load_default=None)
    zip_code = fields.Str(load_default=None)
    state = fields.Str(load_default=None)
    street_address = fields.Str(load_default=None)
    city = fields.Str(load_default=None)
    unit = fields.Str(load_default=None)
    age = fields.Int(load_default=None)
    email = fields.Email(load_default=None)
    phone_number = fields.Str(load_default=None)
    father_name = fields.Str(load_default=None)
    mother_name = fields.Str(load_default=None)
    gender = fields.Str(load_default=None, validate=validate.OneOf(['Male', 'Female', 'Other', 'Prefer not to say']))
    occupation = fields.Str(load_default=None)
    mail_ballot_requested = fields.Bool(load_default=None)
