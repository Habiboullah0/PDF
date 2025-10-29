const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const MAX_CONCURRENT_TASKS = 3;
const mainFolder = process.argv[2] || __dirname;
const outputFolder = path.join(mainFolder, "output");

// التأكد من وجود مجلد الإخراج
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// لحفظ الإحصائيات
const successfulFiles = [];
const failedFiles = [];
const startTime = Date.now(); // بدء حساب الوقت

// البحث عن ملفات PDF
function findPdfFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(findPdfFiles(filePath));
    } else if (stat.isFile() && path.extname(file).toLowerCase() === ".pdf") {
      results.push(filePath);
    }
  });
  return results;
}

const pdfFiles = findPdfFiles(mainFolder);
console.log(`📂 تم العثور على ${pdfFiles.length} ملف PDF.`);

let activeTasks = 0;
let currentIndex = 0;

// تحويل ملف PDF إلى صورة مصغرة
function convertPdfToImage(pdfPath, callback) {
  let relativePath = path.relative(mainFolder, pdfPath);
  
  // استبدال / و المسافات بـ _
  const baseName = relativePath
    .replace(new RegExp(`\\${path.sep}`, "g"), "_")
    .replace(/\s+/g, "_")
    .replace(".pdf", "");

  const destPath = path.join(outputFolder, baseName + ".jpg");

  console.log(`🔄 جارٍ تحويل: ${pdfPath}`);

  // تحويل الصفحة الأولى إلى صورة مصغرة بأقل دقة وجودة
  const cmd = `pdftoppm -jpeg -rx 50 -ry 50 -scale-to 200 -singlefile "${pdfPath}" "${outputFolder}/${baseName}"`;
  
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ خطأ في تحويل ${pdfPath}: ${error.message}`);
      failedFiles.push(relativePath);
    } else {
      console.log(`✅ تم التحويل: ${pdfPath} -> ${destPath}`);
      successfulFiles.push(relativePath);
    }

    callback();
  });
}

// إدارة العمليات بحيث لا تتجاوز الحد الأقصى
function processNext() {
  while (activeTasks < MAX_CONCURRENT_TASKS && currentIndex < pdfFiles.length) {
    const pdfPath = pdfFiles[currentIndex++];
    activeTasks++;

    convertPdfToImage(pdfPath, () => {
      activeTasks--;
      processNext();
    });
  }

  if (activeTasks === 0 && currentIndex >= pdfFiles.length) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2); // الزمن بالثواني

    console.log("\n📊 **إحصائيات العملية**:");
    console.log(`🕒 المدة الزمنية: ${duration} ثانية`);
    console.log(`✅ الملفات الناجحة: ${successfulFiles.length}`);
    if (successfulFiles.length) {
      console.log(`📄 ${successfulFiles.join("\n📄 ")}`);
    }
    console.log(`❌ الملفات الفاشلة: ${failedFiles.length}`);
    if (failedFiles.length) {
      console.log(`⚠️ ${failedFiles.join("\n⚠️ ")}`);
    }
    console.log("🎉 **اكتملت العملية بنجاح!**");
  }
}

// بدء المعالجة
processNext();