/* eslint-disable prefer-destructuring */
import csvParse from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { getRepository } from 'typeorm';
import { uuid } from 'uuidv4';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}
class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    // Lista categorias existentes
    const categoriesList = await categoryRepository.find();

    // Função para chamada do arquivo CSV
    async function loadCSV(filePath: string): Promise<any[]> {
      const readCSVStream = fs.createReadStream(filePath);

      const parseStream = csvParse({
        from_line: 2,
        ltrim: true,
        rtrim: true,
      });

      const parseCSV = readCSVStream.pipe(parseStream);

      const lines: Transaction[] = [];

      parseCSV.on('data', line => {
        lines.push(line);
      });

      await new Promise(resolve => {
        parseCSV.on('end', resolve);
      });

      return lines;
    }
    const csvFilePath = path.resolve(__dirname, `../../tmp/${filename}`);
    const csvData = await loadCSV(csvFilePath);

    let category_id: string;
    // let transactions: Transaction[];

    const transactions = csvData.map(csvLine => {
      // Cria um buffer com as novas categorias, caso não existam na tabela
      const categoryIndex = categoriesList.findIndex(
        category => category.title === csvLine[3],
      );
      if (categoryIndex === -1) {
        category_id = uuid();

        const newCategory: Category = {
          id: category_id,
          title: csvLine[3],
          created_at: new Date(),
          updated_at: new Date(),
        };
        categoriesList.push(newCategory);
      } else {
        category_id = categoriesList[categoryIndex].id;
      }
      const newCategoryIndex = categoriesList.findIndex(
        index => index.id === category_id,
      );
      const transaction = transactionRepository.create({
        id: uuid(),
        title: csvLine[0],
        type: csvLine[1],
        value: csvLine[2],
        // category_id,
        category: categoriesList[newCategoryIndex],
      });

      return transaction;
    });

    await categoryRepository.save(categoriesList);
    await transactionRepository.save(transactions);

    // const newCategories = await categoryRepository.find();
    console.log(transactions);
    return transactions;
  }
}

export default ImportTransactionsService;
