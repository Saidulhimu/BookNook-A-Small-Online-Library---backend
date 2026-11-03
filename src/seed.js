// Adds sample books that are not in the database yet (safe to re-run): `npm run seed`
const { connectDB, client } = require('./config/db');

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
const owner = { userEmail: 'library@booknook.app', userName: 'BookNook Library' };

const books = [
  ['To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'photo-1544947950-fa07a98d237f', 'A childhood in a sleepy Southern town and the crisis of conscience that rocked it.', 4],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 'photo-1512820790803-83ca734da794', 'A portrait of the Jazz Age and the hollow glamour of the American dream.', 3],
  ['Cosmos', 'Carl Sagan', 'Science', 'photo-1451187580459-43490279c0fa', 'A personal voyage through fifteen billion years of cosmic evolution.', 3],
  ['A Brief History of Time', 'Stephen Hawking', 'Science', 'photo-1532012164546-f432f2e3777f', 'From the big bang to black holes, modern astrophysics for everyday readers.', 3],
  ['Sapiens', 'Yuval Noah Harari', 'History', 'photo-1461360370896-922624d12aa1', 'How an insignificant ape became the ruler of planet Earth.', 5],
  ['Guns, Germs, and Steel', 'Jared Diamond', 'History', 'photo-1507842217343-583bb7270b66', 'Why some societies came to dominate others across human history.', 2],
  ['The Little Prince', 'Antoine de Saint-Exupéry', 'Kids', 'photo-1503676260728-1c00da094a0b', 'A pilot stranded in the desert meets a young prince from another planet.', 2],
  ["Charlotte's Web", 'E. B. White', 'Kids', 'photo-1516979187457-637abb4f9353', 'A friendship between a pig named Wilbur and a clever spider.', 4],
  ['Atomic Habits', 'James Clear', 'Others', 'photo-1589829085413-56de8ae18c73', 'An easy, proven way to build good habits and break bad ones.', 6],
  ['Deep Work', 'Cal Newport', 'Others', 'photo-1481627834876-b7833e8f5570', 'Rules for focused success in a distracted world.', 3],
  ['Pride and Prejudice', 'Jane Austen', 'Fiction', 'photo-1495446815901-a7297e633e8d', 'Elizabeth Bennet navigates manners, marriage and misjudgement in Regency England.', 4],
  ['1984', 'George Orwell', 'Fiction', 'photo-1476275466078-4007374efbbe', 'A chilling vision of surveillance, propaganda and the fight for truth.', 3],
  ['The Selfish Gene', 'Richard Dawkins', 'Science', 'photo-1456513080510-7bf3a84b82f8', 'A gene-centred look at evolution that changed how we see life.', 2],
  ['The Immortal Life of Henrietta Lacks', 'Rebecca Skloot', 'Science', 'photo-1497633762265-9d179a990aa6', 'The story of the woman behind the first immortal human cell line.', 3],
  ['The Silk Roads', 'Peter Frankopan', 'History', 'photo-1524995997946-a1c2e315a42f', 'A new history of the world told from the crossroads of East and West.', 2],
  ['A People\'s History of the United States', 'Howard Zinn', 'History', 'photo-1544716278-ca5e3f4abd8c', 'American history through the eyes of workers, women and the marginalised.', 3],
  ['Matilda', 'Roald Dahl', 'Kids', 'photo-1519682337058-a94d519337bc', 'A gifted girl with a love of reading outwits her terrible family and headmistress.', 4],
  ['Where the Wild Things Are', 'Maurice Sendak', 'Kids', 'photo-1491841550275-ad7854e35ca6', 'Max sails to an island of wild creatures and becomes their king.', 3],
].map(([title, author, category, img, description, totalCopies], i) => {
  const t = new Date(Date.now() - i * 60 * 60 * 1000); // spread so "newest first" has an order
  return { title, author, category, image: U(img), description, totalCopies, ...owner, createdAt: t, updatedAt: t };
});

(async () => {
  const db = await connectDB();
  const col = db.collection('books');
  let added = 0;
  for (const book of books) {
    const r = await col.updateOne(
      { title: book.title, userEmail: book.userEmail },
      { $setOnInsert: book },
      { upsert: true }
    );
    if (r.upsertedCount) added += 1;
  }
  console.log(`Added ${added} new books (${books.length - added} already existed).`);
  await client.close();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
