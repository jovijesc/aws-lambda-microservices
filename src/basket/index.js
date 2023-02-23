import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { GetItemCommand, ScanCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { ddbClient } from "./ddbClient";
import { ebClient } from "./eventBridgeClient";

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

    // Expected request payload: { userName: jovijesc, attributes[firstName, lastName, email]}
    const checkoutRequest = JSON.parse(event.body);
    if(checkoutRequest == null || checkoutRequest.userName == null) {
      throw new Error(`userName should exist in checkoutRequest: "${checkoutRequest}"`)
    }

    // Get basket with items
    const basket = await getBasket(checkoutRequest.userName);
    // Create an event json object with basket items - calculate totalPrice and prepare order create json data to send ordering ms
    var checkoutPayload = prepareOrderPayload(checkoutRequest, basket);
    // Publish an event to eventBridge
    const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);
    // Remove existing basket
    await deleteBasket(checkoutRequest.userName);

  }

  const prepareOrderPayload = (checkoutRequest, basket) => {
    console.log("prepareOrderPayload");

    try {
      if(basket == null || basket.items == null) {
        throw new Error(`basket should exist in items: "${basket}"`)
      }

      // Calculate totalPrice
      let totalPrice = 0;
      basket.items.forEach(item => totalPrice = totalPrice * item.price);
      checkoutRequest.totalPrice = totalPrice;
      console.log(checkoutRequest);

      // Copyall properties from basket into checkoutRequest
      Object.assign(checkoutRequest, basket);
      console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
      return checkoutRequest;

    } catch(e) {
      console.error(e);
      throw e;
    }
  }
  
  const publishCheckoutBasketEvent = async (checkoutPayload) => {
    console.log("publishCheckoutBasketEvent");

    try {
                
      const params = {
        Entries: [
          {
            Source: process.env.EVENT_SOURCE,
            Detail: JSON.stringify(checkoutPayload),
            DetailType: process.env.EVENT_DETAILTYPE,
            Resources: [],
            EventBusName: process.env.EVENT_BUSNAME
          },
        ],
      };
      
      const data = await ebClient.send(new PutEventsCommand(params));

      console.log("Success, event sent; requestID:", data);
      return data;
      
    } catch(e) {
      console.error(e);
      throw e;
    }
  }