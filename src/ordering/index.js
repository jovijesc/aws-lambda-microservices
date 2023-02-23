import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { PutItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "./ddbClient";


exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));  
    let body; 
  
    // Attribute detail-type is getting from EventBridge request
    const eventType = event['detail-type'];
    if(eventType !== undefined) {
      // Request is from EventBridge Invocation - async
      await eventBridgeInvocation(event);

    } else {

      // Request is from API Gateway Invocation -- return sync response
      return await apiGatewayInvocation(event);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body
      })
    };
   
  };

  const eventBridgeInvocation = async (event) => {    
    console.log(`eventBridgeInvocation function. event : "${event}"`);
    await createOrder(event.detail);
  }

  const createOrder = async (basketCheckoutEvent) => {    

    try {
      console.log(`createOrder function. event : "${basketCheckoutEvent}"`);
  
      // orderDate for SK(sort key) in dynamodb
      const orderDate = new Date().toISOString();
      basketCheckoutEvent.orderDate = orderDate;
      console.log(basketCheckoutEvent);

      const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Item: marshall(basketCheckoutEvent || {})
      };
  
      const createResult = await ddbClient.send(new PutItemCommand(params));
      console.log(createResult);
      return createResult;
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  const apiGatewayInvocation = async (event) => {
    console.log(`apiGatewayInvocation function. event : "${event}"`);
    let body; 
    try {
      switch (event.httpMethod) {
        case "GET":          
          if (event.pathParameters != null) {
            body = await getOrder(event); // GET order/{id}
          } else {
            body = await getAllOrders(); // GET order
          }
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
  }

  const getOrder = async (event) => {
    console.log("getOrder");
    try {
      // request: url/order/jovijesc?orderDate=timestamp
      const userName = event.pathParameters.userName;
      const orderDate = event.queryStringParameters.orderDate;
  
      const params = {              
        KeyConditionExpression: "userName = :userName and orderDate = :orderDate",        
        ExpressionAttributeValues: {
          ":userName": { S: userName },
          ":orderDate": { S: orderDate }
        },
        TableName: process.env.DYNAMODB_TABLE_NAME
      };
  
      const { Items } = await ddbClient.send(new QueryCommand(params));
  
      console.log(Items);
      return (Items) ? Items.map((item) => unmarshall(item)) : {};
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }

  const getAllOrders = async () => {
    console.log("getAllOrders");    
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
