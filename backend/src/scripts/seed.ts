import axios from 'axios';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question';
import connectDB from '../config/db';

dotenv.config();

const SEED_URL = process.env.EXCEL_GITHUB_URL || 'https://raw.githubusercontent.com/sample/sample/main/questions.xlsx';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Fetching Excel file from GitHub...');
    
    // Fetch the Excel file as an arraybuffer
    const response = await axios.get(SEED_URL, { responseType: 'arraybuffer' });
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(response.data);
    
    const worksheet = workbook.worksheets[0]; // Assuming data is on the first sheet
    const questions: any[] = [];
    
    // Assuming the first row is headers: Company, Title, Topic, Difficulty, IsPremium
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      
      const company = row.getCell(1).text;
      const title = row.getCell(2).text;
      const topic = row.getCell(3).text;
      const difficulty = row.getCell(4).text as 'Easy' | 'Medium' | 'Hard';
      const isPremiumStr = row.getCell(5).text;
      
      if (company && title) {
        questions.push({
          company: company.trim(),
          title: title.trim(),
          topic: topic ? topic.trim() : 'General',
          difficulty: difficulty || 'Medium',
          isPremium: isPremiumStr.toLowerCase() === 'true' || isPremiumStr === '1',
        });
      }
    });
    
    console.log(`Parsed ${questions.length} questions. Inserting into MongoDB...`);
    
    await Question.deleteMany({}); // Clear existing questions
    await Question.insertMany(questions);
    
    console.log('Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDatabase();
