import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SwnApiGatewayProps {
    productMicroservice: IFunction,
    basketMicroservice: IFunction,
    orderingMicroservice: IFunction
}

export class SwnApiGateway extends Construct {    

    constructor(scope: Construct, id: string, props: SwnApiGatewayProps) {
        super(scope, id);

        this.createProductApi(props.productMicroservice); 
        this.createBasketApi(props.basketMicroservice); 
        this.createOrdertApi(props.orderingMicroservice); 
    }

    private createProductApi(productMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'productApi', {
            restApiName: 'Product Service',
            handler: productMicroservice,
            proxy: false
        });

        const productEndpoint = apigw.root.addResource('product');
        productEndpoint.addMethod('GET'); // GET /product
        productEndpoint.addMethod('POST'); // POST /product

        const singleProducEndpoint = productEndpoint.addResource('{id}'); 
        singleProducEndpoint.addMethod('GET'); // GET /product/{id}
        singleProducEndpoint.addMethod('PUT'); // PUT /product/{id}
        singleProducEndpoint.addMethod('DELETE'); // DELETE /product/{id}
    }

    private createBasketApi(basketMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'basketApi', {
            restApiName: 'Basket Service',
            handler: basketMicroservice,
            proxy: false
        });

        const basketEndpoint = apigw.root.addResource('basket');
        basketEndpoint.addMethod('GET'); // GET /basket
        basketEndpoint.addMethod('POST'); // POST /basket

        const singleBasketEndpoint = basketEndpoint.addResource('{userName}'); 
        singleBasketEndpoint.addMethod('GET'); // GET /basket/{userName}        
        singleBasketEndpoint.addMethod('DELETE'); // DELETE /basket/{userName}

        const basketCheckoutEndpoint = basketEndpoint.addResource('checkout'); // /basket/checkout
        basketCheckoutEndpoint.addMethod('POST'); // POST /basket/checkout      
    }

    private createOrdertApi(orderingMicroservice: IFunction) {
        const apigw = new LambdaRestApi(this, 'orderApi', {
            restApiName: 'Order Service',
            handler: orderingMicroservice,
            proxy: false
        });

        const orderEndpoint = apigw.root.addResource('order');
        orderEndpoint.addMethod('GET'); // GET /order        

        const singleOrderEndpoint = orderEndpoint.addResource('{userName}'); 
        singleOrderEndpoint.addMethod('GET'); // GET /order/{userName}                
            
    }
}