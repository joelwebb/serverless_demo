import boto3
from slack_sdk import WebhookClient
import traceback
import json
import os
import time
import datetime
import base64

# Initialize Slack Webhook
webhook = WebhookClient("https://hooks.slack.com/triggers/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")



#define the lambda event handler 
def handler(event, context):
    try:
      print("Lambda Event : " + str(event))
      webhook.send(text="Lambda Event : " + str(event))

      # parse a JSON message from the event that contains a B64 encoded string with a dictionary
      # decode the B64 string that includes the following: Model Type *
     # model_name
     # Patient UUID (Optional)
      #CDT Code (Optional)
      #Amount (Optional)
     # Notes (Optional)
     # Date (Optional)

      # return a JSON message with the following: Model Type *, Confidence Score *, Classification, date/timestamp, 
      
      pass

    except Exception as e:
          error_info = traceback.format_exc()
          print(" Lambda Error : " + str(e))
          webhook.send(text="Lambda Error - : " + str(e) + " trace_back :" + error_info)
          return False


# Testing directly
if __name__ == "__main__":
    event = {
        "JSON data": ""
    }
    handler(event, context=None)