import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
const { GetItemCommand, ScanCommand, PutItemCommand, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const { ddbClient } = require("../basket/ddbClient");

exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));
  
    let body; 
    try {
      switch (event.httpMethod) {
        case "GET":
          if (event.pathParameters != null) {
            body = await getBasket(event.pathParameters.userName); // GET basket/{userName}
          } else {
            body = await getAllBaskets(); // GET basket
          }
          break;
        case "POST":
          if(event.path == "/basket/checkout") {
            body = await checkoutBasket(event);
          } else {
            body = await createBasket(event);
          }          
          break;
        case "DELETE":
          body = await deleteBasket(event.pathParameters.userName); // DELETE /basket/{userName}
          break;        
        default:
          throw new Error(`Unsupported route: "${event.httpMethod}"`);
      }
  
      console.log(body);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Successfully finished operation: "${event.httpMethod}"`,
          body: body
        })
      };
  
    } catch (e) {
      console.error(e);
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Failed to perform operation.",
          errorMsg: e.message,
          errorStack: e.stack,
        })
      };
    }
  };


  const getBasket = async(userName) => {
    console.log("getBasket");

    try {

        const params = {
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Key: marshall({ userName: userName })
        };
    
        const { Item } = await ddbClient.send(new GetItemCommand(params));
    
        console.log(Item);
        return (Item) ? unmarshall(Item) : {};
    
      } catch(e) {
        console.error(e);
        throw e;
      }
  }

  const getAllBaskets = async () => {
    console.log("getAllBaskets");
  
    try {
  
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME
      };
  
      const { Items } = await ddbClient.send(new ScanCommand(params));
  
      console.log(Items);
      return (Items) ? Items.map((item) => unmarshall(item)) : {};
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  const createBasket = async (event) => {
    console.log(`createBasket function. event : "${event}"`);
  
    try {
  
      const basketRequest = JSON.parse(event.body);      
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(basketRequest || {})
      };
  
      const createResult = await ddbClient.send(new PutItemCommand(params));
      console.log(createResult);
      return createResult;
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  const deleteBasket = async (userName) => {
    console.log(`deleteBasket function. userName : "${userName}"`);
  
    try {
  
      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: marshall({ userName: userName })
      };
  
      const  deleteResult = await ddbClient.send(new DeleteItemCommand(params));
  
      console.log(deleteResult);
      return deleteResult;
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }
  

  const checkoutBasket = async (event) => {
    console.log(`checkoutBasket function. event : "${event}"`);
  }
  