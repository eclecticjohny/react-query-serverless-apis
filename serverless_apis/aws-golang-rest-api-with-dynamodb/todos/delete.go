package main

import (
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"

	"fmt"
	"os"
)

type Item struct {
	Id        string `json:"id,omitempty"`
	Task      string `json:"task"`
	Completed bool   `json:"completed"`
	Created   int64  `json:"created"`
	Updated   int64  `json:"updated"`
}

func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

	// Creating session for client
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	pathParamId := request.PathParameters["id"]

	input := &dynamodb.DeleteItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(pathParamId),
			},
		},
		TableName: aws.String(os.Getenv("DYNAMODB_TABLE")),
	}

	// DeleteItem request
	_, err := svc.DeleteItem(input)

	// Checking for errors, return error
	if err != nil {
		fmt.Println("Got error calling DeleteItem: ", err.Error())
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
