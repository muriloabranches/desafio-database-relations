import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer does not exists.');
    }

    const productsId = products.map(({ id }) => ({ id }));

    const findProducts = await this.productsRepository.findAllById(productsId);

    if (products.length !== findProducts.length) {
      throw new AppError('You have informed invalid products');
    }

    findProducts.forEach(product => {
      const productInOrder = products.find(({ id }) => product.id === id);

      if (productInOrder) {
        if (productInOrder.quantity > product.quantity) {
          throw new AppError(
            'You have selected products with insufficient quantities',
          );
        }
      }
    });

    const formattedProducts = findProducts.map(({ id, price }) => ({
      product_id: id,
      price,
      quantity: products.find(product => product.id === id)?.quantity || 0,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: formattedProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
