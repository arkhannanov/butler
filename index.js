const fs = require('fs');

// Генерация списка email'ов
const generateEmailList = (count) => {
    const names = [
        "Иванов Иван Иванович", "Иванов И И", "Ли Тян",
        "Петров Петя", "Вася Петров", "Алексей Смирнов",
        "Екатерина Фролова", "Мария Иванова", "Иван Иванов",
        "Анна Петрова", "Павел Захаров", "Сергей Орлов",
        "Ольга Кузнецова", "Николай Чернов", "Елена Соколова",
        "Григорий Котов", "Вероника Сергеева", "Олег Князев",
        "Владимир Медведев", "Татьяна Громова", "Артур Морозов"
    ];

    const emails = [];

    for (let i = 0; i < count; i++) {
        const hasName = Math.random() > 0.5;
        const fio = hasName ? names[Math.floor(Math.random() * names.length)] : "";
        emails.push({ fio: fio, email: `example${i + 1}@email.com` });
    }

    return emails;
};

// Сохранение email'ов в файл
function saveEmails(emails) {
    fs.writeFileSync('emails.json', JSON.stringify(emails, null, 2), 'utf8');
    console.log('Email list saved to file.');
}

// Загрузка email'ов из файла
function loadEmails() {
    try {
        const data = fs.readFileSync('emails.json', 'utf8');
        console.log('Email list loaded from file.');
        return JSON.parse(data);
    } catch (err) {
        console.log('No existing email list found, generating a new one.');
        return null;
    }
}

// Загрузка списка успешно отправленных email'ов
function loadSentEmails() {
    try {
        const data = fs.readFileSync('sentEmails.json', 'utf8');
        console.log('Sent email list loaded from file.');
        return new Set(JSON.parse(data));
    } catch (err) {
        console.log('No existing sent email list found, starting fresh.');
        return new Set();
    }
}

// Сохранение списка успешно отправленных email'ов
function saveSentEmails(emailsSet) {
    fs.writeFileSync('sentEmails.json', JSON.stringify(Array.from(emailsSet), null, 2), 'utf8');
    console.log('Sent email list saved to file.');
}

// Функция "отправки" письма
async function sendEmail(email, name) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.floor(Math.random() * 10) > 0) {
                console.log(`Письмо успешно отправлено на ${email}`);
                resolve(Math.floor(Math.random() * 100000)); // Успешно отправлено
            } else {
                console.error(`Ошибка отправки письма на ${email}`);
                reject(new Error('не отправлено')); // Ошибка
            }
        }, Math.floor(Math.random() * (2000 - 100) + 100)); // Имитация задержки отправки
    });
}

// Функция-ограничитель для обработки не более 10 писем в 10 секунд
async function processEmailsWithLimit(emails, successfullySentEmails) {
    const results = [];
    const batchSize = 10; // Максимум 10 писем за раз
    const delay = 10000; // 10 секунд задержки между партиями

    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);
        const batchPromises = batch.map(async ({ fio, email }) => {
            if (successfullySentEmails.has(email)) {
                return { email, status: 'уже отправлено' };
            }
            try {
                const name = fio || 'клиент';
                await sendEmail(email, name);
                successfullySentEmails.add(email);
                return { email, status: 'успех' };
            } catch (error) {
                return { email, status: 'ошибка' };
            }
        });

        // Ждем результатов выполнения текущей партии
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Если остались еще письма, ждем 10 секунд перед обработкой следующей партии
        if (i + batchSize < emails.length) {
            console.log(`Ожидание ${delay / 1000} секунд перед следующей партией...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    return results;
}

async function main() {
    let emails = loadEmails(); // Загружаем список email'ов

    if (!emails) {
        emails = generateEmailList(45); // Генерируем email'ы, если их нет
        saveEmails(emails); // Сохраняем сгенерированный список
    }

    const successfullySentEmails = loadSentEmails(); // Загружаем отправленные email'ы

    // Если все письма уже отправлены
    if (successfullySentEmails.size === emails.length) {
        console.log('Все письма уже отправлены. 😊');
        return;
    }

    // Отправляем письма с учетом ограничений
    const results = await processEmailsWithLimit(emails, successfullySentEmails);

    // Сохраняем обновленный список успешно отправленных email'ов
    saveSentEmails(successfullySentEmails);

    console.log('Результаты отправки:', results);

    if (successfullySentEmails.size === emails.length) {
        console.log("Поздравляем! Все письма успешно отправлены 🎉");
    }
}

main().catch(console.error);
