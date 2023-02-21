import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
    productMicroservice: IFunction
}

export class SwnApiGateway extends Construct {    

    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id);

        const apigw = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: props.productMicroservice,
            proxy: false
          });
      
          const productEndpoint = apigw.root.addResource('product');
          productEndpoint.addMethod('GET'); // GET /product
          productEndpoint.addMethod('POST'); // POST /product
      
          const singleProducEndpoint = productEndpoint.addResource('{id}'); // /product/{id}
          singleProducEndpoint.addMethod('GET'); // GET /product/{id}
          singleProducEndpoint.addMethod('PUT'); // PUT /product/{id}
          singleProducEndpoint.addMethod('DELETE'); // DELETE /product/{id}
    }
}