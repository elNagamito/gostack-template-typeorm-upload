// import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';
import { uuid } from 'uuidv4';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    // Verifica se a categoria inserida já exista no banco de dados
    const checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id: string;

    if (checkCategoryExists) {
      category_id = checkCategoryExists.id;
    } else {
      category_id = uuid();
    }

    // Preenche estrutura para criação dos dados
    const transaction = transactionRepository.create({
      id: uuid(),
      title,
      type,
      value,
      category_id,
    });

    const newCategory = categoryRepository.create({
      id: category_id,
      title: category,
    });

    // if (isCSV === 'false') {
    // Verifica se o valor de saída é maior do que o saldo atual
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const { balance } = await transactionsRepository.getBalance();
    if (transaction.type === 'outcome' && transaction.value > balance.total) {
      throw new AppError('Outcome should not be higher than income!', 400);
    }
    // }

    // Commit dos dados no banco
    await categoryRepository.save(newCategory);
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
