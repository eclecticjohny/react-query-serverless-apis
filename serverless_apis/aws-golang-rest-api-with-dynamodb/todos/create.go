package main

import (
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"

	"encoding/json"
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

type CreateItem struct {
	Id   string `json:"id"`
	Task string `json:"task"`
}

func Handler(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	timestamp := time.Now().UnixNano() / int64(time.Millisecond)

	// Creating session for client
	sess := session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	}))

	// Create DynamoDB client
	svc := dynamodb.New(sess)

	// Unmarshal to Item to access object properties
	itemString := request.Body
	itemStruct := CreateItem{}
	json.Unmarshal([]byte(itemString), &itemStruct)

	if itemStruct.Task == "" {
		return events.APIGatewayProxyResponse{StatusCode: 400}, nil
	}

	// Create new item of type item
	item := Item{
		Id:        itemStruct.Id,
		Task:      itemStruct.Task,
		Completed: false,
		Created:   timestamp,
		Updated:   timestamp,
	}

	// Marshal to dynamobb item
	av, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		fmt.Println("Error marshalling item: ", err.Error())
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}

	tableName := os.Getenv("DYNAMODB_TABLE")

	// Build put item input
	fmt.Println("Putting item: %v", av)
	input := &dynamodb.PutItemInput{
		Item:      av,
		TableName: aws.String(tableName),
	}

	// PutItem request
	_, err = svc.PutItem(input)

	// Checking for errors, return error
	if err != nil {
		fmt.Println("Got error calling PutItem: ", err.Error())
		return events.APIGatewayProxyResponse{StatusCode: 500}, nil
	}

	// Marshal item to return
	itemMarshalled, err := json.Marshal(item)

	fmt.Println("Returning item: ", string(itemMarshalled))

	//Returning response with AWS Lambda Proxy Response
	return events.APIGatewayProxyResponse{
		Body:       string(itemMarshalled),
		StatusCode: 200,
		Headers: map[string]string{
			"Access-Control-Allow-Origin":      "*",
			"Access-Control-Allow-Credentials": "true",
		}}, nil
}

func main() {
	lambda.Start(Handler)
}
