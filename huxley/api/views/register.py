# Copyright (c) 2011-2022 Berkeley Model United Nations. All rights reserved.
# Use of this source code is governed by a BSD License (see LICENSE).
import datetime
from typing import List

from django.db import transaction

from rest_framework import generics, response, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied

import invoice_automation.src.model.school
from huxley.api.serializers import CreateUserSerializer, RegistrationSerializer
from huxley.core.models import Conference, School
from invoice_automation.src import handler
from invoice_automation.src.model.address import Address
from invoice_automation.src.model.registration import Registration
from invoice_automation.src.model.conference import Conference as invoiceConference


class Register(generics.GenericAPIView):
    authentication_classes = (SessionAuthentication, )
    serializer_classes = {
        'user': CreateUserSerializer,
        'registration': RegistrationSerializer
    }

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if Conference.get_current().open_reg:
            return self.register(request, *args, **kwargs)
        raise PermissionDenied('Conference registration is closed.')

    def register(self, request, *args, **kwargs):
        user_data = request.data['user']
        registration_data = request.data['registration']

        with transaction.atomic():
            user_serializer = self.serializer_classes['user'](data=user_data)
            user_is_valid = user_serializer.is_valid()
            if not user_is_valid:
                registration_serializer = self.serializer_classes[
                    'registration'](data=registration_data)
                registration_serializer.is_valid()
                errors = registration_serializer.errors
                errors.update(user_serializer.errors)
                return response.Response(
                    errors, status=status.HTTP_400_BAD_REQUEST)

            user_serializer.save()
            school_id = user_serializer.data['school']['id']
            registration_data['school'] = school_id
            registration_serializer = self.serializer_classes['registration'](
                data=registration_data)
            registration_serializer.is_valid(raise_exception=True)
            registration_serializer.save()

        school_data = user_data['school']
        address = Address(line1=school_data['address'],
                          line2='',
                          city=school_data['city'],
                          country_sub_division_code=school_data['state'],
                          country=school_data['country'],
                          zip_code=school_data['zip_code'])

        num_delegates = sum(
            map(
                int,
                [
                    registration_data['num_beginner_delegates'],
                    registration_data['num_intermediate_delegates'],
                    registration_data['num_advanced_delegates']
                ]
            )
        )
        call_invoice_handler(
            school_name=school_data['name'],
            email=school_data['primary_email'],
            phone_numbers=[school_data['primary_phone'], school_data['secondary_phone']],
            address=address,
            num_delegates=num_delegates
        )

        data = {'user': user_serializer.data,
                'registration': registration_serializer.data}
        return response.Response(data, status=status.HTTP_200_OK)


def call_invoice_handler(school_name: str,
                         email: str,
                         phone_numbers: List[str],
                         address: Address,
                         num_delegates: int):
    school = invoice_automation.src.model.school.School(school_name, email, phone_numbers, address)
    registration = invoice_automation.src.model.registration.Registration(
        school=school,
        num_delegates=num_delegates,
        conference=invoiceConference.BMUN71,
        registration_date=datetime.date.today()
    )
    handler.handle_registration(registration)
