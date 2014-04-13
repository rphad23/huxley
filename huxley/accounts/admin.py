#!/usr/bin/env python

# Copyright (c) 2011-2014 Berkeley Model United Nations. All rights reserved.
# Use of this source code is governed by a BSD License found in README.md.

from django.contrib import admin
from huxley.accounts.models import HuxleyUser

admin.site.register(HuxleyUser)
