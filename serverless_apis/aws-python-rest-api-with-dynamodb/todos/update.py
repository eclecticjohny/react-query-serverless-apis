import json
import time
import logging
import os

from todos import decimalencoder
import boto3
dynamodb = boto3.resource('dynamodb')


def update(event, context):
    data = json.loads(event['body'])
    if 'task' not in data or 'completed' not in data:
        logging.error("Validation Failed")
        raise Exception("Couldn't update the todo item.")
        return

    timestamp = round(time.time() * 1000)

    table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

    # update the todo in the database
    result = table.update_item(
        Key={
            'id': event['pathParameters']['id']
        },
        ExpressionAttributeNames={
            '#todo_task': 'task',
        },
        ExpressionAttributeValues={
            ':task': data['task'],
            ':completed': data['completed'],
            ':updated': timestamp,
        },
        UpdateExpression='SET #todo_task = :task, '
                         'completed = :completed, '
                         'updated = :updated',
        ReturnValues='ALL_NEW',
    )

    # create a response
    response = {
        'statusCode': 200,
        'body': json.dumps(result['Attributes'],
                           cls=decimalencoder.DecimalEncoder),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': True,
        }
    }

    return response
