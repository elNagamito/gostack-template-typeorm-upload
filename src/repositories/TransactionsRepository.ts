import {
  EntityRepository,
  Repository,
  getRepository,
  // TransactionManager,
} from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionDetail {
  id: string;
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: Category;
  created_at: Date;
  updated_at: Date;
}

interface Totals {
  transactions: TransactionDetail[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Totals> {
    // Busca todas as transações realizadas
    const transactionRepository = getRepository(Transaction);
    const transactions = transactionRepository.find();
    const transactionsList = [...(await transactions)];

    // Busca todas as categorias realizadas
    const categoryRepository = getRepository(Category);
    const categories = categoryRepository.find();
    const categoriesList = [...(await categories)];

    // Calcula o total de entrada de capital
    const totalIncome = transactionsList.reduce((total, income) => {
      if (income.type === 'income') total += Number(income.value);
      return total;
    }, 0);

    // Calcula o total de saída de capital
    const totalOutcome = transactionsList.reduce((total, income) => {
      if (income.type === 'outcome') total += Number(income.value);
      return total;
    }, 0);

    // Preenche objeto de retorno
    const details = transactionsList.map(transaction => {
      const index = categoriesList.findIndex(
        category => category.id === transaction.category_id,
      );
      const detail: TransactionDetail = {
        id: transaction.id,
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: categoriesList[index],
        created_at: transaction.created_at,
        updated_at: transaction.updated_at,
      };
      return detail;
    });

    const Totals: Totals = {
      transactions: details,
      balance: {
        income: totalIncome,
        outcome: totalOutcome,
        total: totalIncome - totalOutcome,
      },
    };

    return Totals;
  }
}

export default TransactionsRepository;
