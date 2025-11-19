const fs = require('fs/promises');  
const path = require('path');  
  
// دالة لاستبدال المسافات و/ بشرطة سفلية _  
function replaceSpacesAndSlashes(filePath) {  
  return filePath.replace(/ /g, '_').replace(/\//g, '_');  
}  
  
async function scanDirectory(rootDir, currentDir, result = []) {  
  const entries = await fs.readdir(currentDir, { withFileTypes: true });  
  
  for (const entry of entries) {  
    const fullPath = path.join(currentDir, entry.name);  
      
    if (entry.isDirectory()) {  
      await scanDirectory(rootDir, fullPath, result);  
    } else if (  
      entry.isFile() &&   
      path.extname(entry.name).toLowerCase() === '.pdf'  
    ) {  
      const stats = await fs.stat(fullPath);  
      const relativePath = path.relative(rootDir, fullPath);  
        
      // تطبيق دالة استبدال المسافات والشرطة  
      const modifiedPath = replaceSpacesAndSlashes(relativePath);  
  
      result.push({  
        path: modifiedPath,  
        size: stats.size  
      });  
    }  
  }  
  return result;  
}  
  
async function generatePDFIndex(rootDir) {  
  try {  
    const output = await scanDirectory(rootDir, rootDir);  
    const outputPath = path.join(rootDir, 'pdf-files.json');  
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));  
    console.log(`تم إنشاء الملف بنجاح: ${outputPath}`);  
  } catch (error) {  
    console.error('حدث خطأ:', error);  
  }  
}  
  
// التشغيل من خلال وسيطات سطر الأوامر  
const rootDirectory = process.argv[2];  
if (!rootDirectory) {  
  console.log('الرجاء تحديد مسار المجلد الرئيسي');  
  console.log('مثال: node index.js ./path/to/folder');  
  process.exit(1);  
}  
  
generatePDFIndex(path.resolve(rootDirectory));