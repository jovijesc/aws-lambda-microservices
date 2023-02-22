
exports.handler = async function(event) {
    console.log("request:", JSON.stringify(event, undefined, 2));  
    let body; 
  
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body
      })
    };
   
  };


