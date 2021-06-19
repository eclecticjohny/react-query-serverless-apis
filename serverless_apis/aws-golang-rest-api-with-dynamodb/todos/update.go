package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"

	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"
)

type Item struct {
	Id        string `json:"id,omitempty"`
	Task      string `json:"task"`
	Completed bool   `json:"completed"`
	Created   int64  `json:"created"`
	Updated   int64  `json:"updated"`
}

type ItemUpdate struct {
	Task      string `json:"task"`
	Completed bool   `json:"completed"`
	Updated   int64
}

func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)

	// Creating session for client
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	pathParamId := request.PathParameters["id"]

	itemString := request.Body
	itemStruct := ItemUpdate{}
	json.Unmarshal([]byte(itemString), &itemStruct)

	info := ItemUpdate{
		Task:      itemStruct.Task,
		Completed: itemStruct.Completed,
		Updated:   timestamp,
	}

	fmt.Println("Updating task to: ", info.Task)
	fmt.Println("Updating completed to: ", info.Completed)

	// Prepare input for Update Item
	input := &dynamodb.UpdateItemInput{
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":t": {
				S: aws.String(info.Task),
			},
			":c": {
				BOOL: aws.Bool(info.Completed),
			},
			":u": {
				N: aws.String(strconv.Itoa(int(timestamp))),
			},
		},
		TableName: aws.String(os.Getenv("DYNAMODB_TABLE")),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(pathParamId),
			},
		},
		ReturnValues:     aws.String("UPDATED_NEW"),
		UpdateExpression: aws.String("set task = :t, completed = :c, updated = :u"),
	}

	// UpdateItem request
	_, err := svc.UpdateItem(input)

	// Checking for errors, return error
	if err != nil {
		fmt.Println(err.Error())
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}

	return events.APIGatewayProxyResponse{
		StatusCode: 204,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":      "*",
			"Access-Control-Allow-Credentials": "true",
		}}, nil
}

func main() {
	lambda.Start(Handler)
}
