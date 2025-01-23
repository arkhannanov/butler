const fs = require('fs');

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

// Сохранение email'ов в файл
function saveEmails(emails) {
    fs.writeFileSync('emails.json', JSON.stringify(emails, null, 2), 'utf8');
    console.log('Email list saved to file.');
}

async function sendEmail(email, name) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.floor(Math.random() * 10) > 0) {
                console.log(`отправлено на ${email}`);
                resolve(Math.floor(Math.random() * 100000));
            } else {
                console.error(`не отправлено на ${email}`);
                reject(new Error('не отправлено'));
            }
        }, Math.floor(Math.random() * (2000 - 100) + 100));
    });
}

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

function saveSentEmails(emailsSet) {
    fs.writeFileSync('sentEmails.json', JSON.stringify(Array.from(emailsSet), null, 2), 'utf8');
    console.log('Sent email list saved to file.');
}

async function main() {
    let emails = loadEmails(); // Загружаем существующие email'ы из файла

    if (!emails) {
        emails = generateEmailList(130); // Генерируем email'ы, если они ещё не сохранены
        saveEmails(emails); // Сохраняем сгенерированные email'ы
    }

    const successfullySentEmails = loadSentEmails();

    if (successfullySentEmails.size === emails.length) {
        console.log('Нет смысла заново запускать скрипт, так как все письма успешно отправлены. 😊');
        return;
    }

    const results = [];
    let index = 0;

    while (index < emails.length) {
        const batch = emails.slice(index, index + 60);
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

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        index += 60;

        if (index < emails.length) {
            await new Promise(resolve => setTimeout(resolve, 60000)); // Ждем минуту
        }
    }

    saveSentEmails(successfullySentEmails);
    console.log('Результаты отправки:', results);

    if (successfullySentEmails.size === emails.length) {
        console.log("Это Успех! На все email'ы отправлены письма 🎉");
    }
}

main().catch(console.error);
