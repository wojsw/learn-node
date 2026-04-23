# 数据库

## 安装 postgresql

brew install postgresql@15

## 启动

brew services start postgresql@15

## 查看是否启动成功

psql --version

## 查看用户

psql -U "$(whoami)" -d postgres 

\du

## 查看当前用户数据库

psql交互状态 \list
psql -U jinshengwang -l

## 进入数据库

psql -U jinshengwang -d database-name

创建表

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

注意分号

\dt 查看当前数据库下的所有表

\q 退出数据库







