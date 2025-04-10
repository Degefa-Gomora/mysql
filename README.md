# mysql
works on mysql data base

- MultipleConnection.js module contains the same file but that uses the multiple connection of mysql data base using mysql.createPool
- And it contains call back hell

- Callback Hell occurs when multiple nested callbacks are used, making the code hard to read, maintain, and debug. This happens because each function depends on the result of the previous function, leading to a deeply indented, "pyramid-like" structure.

Problems with app.js Code (Callback Hell Issues)
❌ Deep Nesting (Pyramid of Doom) → Each query depends on the previous one, making the code hard to follow.
❌ Difficult to Debug → If an error happens in one query, it may be unclear where it occurred.
❌ Hard to Maintain → Adding or modifying a query requires modifying multiple levels of callbacks.
❌ No Transaction Handling → If one query fails, previous inserts are not rolled back, leaving the database in an inconsistent state.


How We Fixed Callback Hell in the New Code
✅ Use async/await
    -Asyawt.js file 
Instead of nesting callbacks, each query runs sequentially using await.

✅ 
- promise.js file
This library allows us to use Promises instead of callbacks, making the code more readable.

✅ Use Transactions (beginTransaction, commit, rollback)
  -transaction.js file
Ensures that either all operations succeed or none happen (avoiding partial data insertion).


