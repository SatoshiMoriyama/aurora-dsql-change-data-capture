-- Aurora DSQL CDC 検証用テーブル
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- テストデータ投入
INSERT INTO orders (id, customer_name, item, quantity, status) VALUES
(1, '田中太郎', 'ノートPC', 1, 'pending'),
(2, '鈴木花子', 'マウス', 2, 'pending'),
(3, '佐藤次郎', 'キーボード', 1, 'pending');

-- UPDATE テスト
UPDATE orders SET status = 'shipped' WHERE id = 1;

-- DELETE テスト
DELETE FROM orders WHERE id = 3;
