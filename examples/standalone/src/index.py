#!/usr/bin/python
# -*- coding: utf-8 -*-

import time
import json

from thingspro.edge.http_v1 import http


def hello_moxa(resource, headers, message):
    """ hello_moxa handle function """
    return http.Response(code=200, data='Hello Moxa')


if __name__ == "__main__":
    # callback function
    http.Server.GET('/hello/moxa', hello_moxa)
    # infinite loop
    while True:
        time.sleep(1)