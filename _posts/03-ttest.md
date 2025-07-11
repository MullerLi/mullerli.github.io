# 平均值檢定


## 利用t檢定比較兩個族群平均值

在分析實驗結果時，我們最關切的問題，應屬"平均值之間是否有差異"。比較兩個平均值的差異，可以用t檢定；超過兩組平均值的比較，可用` (analysis of variance, ANOVA) 來檢定各組平均是否有差異。


### 資料下載

本筆資料為riceYield，係由亂數產生，下面這個程式碼只要執行一次就好。
```r
# 產生亂數資料
riceYield<-data.frame(
  'treatment' = (rep(c('A','B'),each=10) ),
  'yield' = c(rnorm(n = 10 , mean = 5000 , sd = 400),rnorm(n=10 , mean = 6500 , sd = 400)
))
```


現在來看看這筆資料長怎樣：
```r
# 查看 前 10筆資料
head(riceYield)
```


```r
head(riceYield)
```

```r
# 查看 後 10筆資料
tail(riceYield)

```

```r
# 查看 後 10筆資料
tail(riceYield)
```
首先看到這個東西稱為資料表 (dataframe)，資料表由兩個欄位 (columns)，treatment和yield；在每個欄位下面都有很多筆資料，這些值我們稱為觀測值 (observation)；觀測值左方的數字為列 (row)，可以看到這筆資料有2欄20列。

而上方使用到的2個函數(function)的意思：

- `head(資料名稱)`: 查看該資料前6筆的值
- `tail(資料名稱)`: 查看該資料後6筆的值

利用這兩個函數，我們可以很快速地查看資料的大致樣態。

---

補充

* 在 R 中直接輸入「物件的名稱」，而沒有用冒號 ( " or ' ) 括起來，就會得到「物件的內容」。

例如上述資料集為"riceYield"，所以輸入riceYield就會連結到該筆資料。

* 英文字母的大小寫在R程式裡面是不一樣的意思。所以輸入riceyield或Riceyield或RiceYield會跳出錯誤，找不到這個東西(object 'riceyield' not found)，因為riceYield才有意義。
```r
print(riceyield)
```

---

如果想要查看整筆資料，可以直接輸入資料名稱，或是`print(資料名稱)`、`view(資料名稱)`
```r
riceYield
# 等同於
print(riceYield)
```

```r
riceYield
```

### 兩樣本t檢定


```r
t.test(data = riceYield,
       yield ~ treatment,
       paired = F)
```
- `t.test`上面有三個指令
  - 第1個指令該筆資料的名稱，這筆資料名是資料riceYield，輸入data = riceYield
  - 第2個指令和第1個指令中間用 , 相隔
  - 第2個指令是告訴R比較的方式，寫法是  觀測值 ~ 處理名稱，注意這裡觀測值和處理名稱都沒有用冒號框住
  - 第3個指令是樣本是否成對


逐行看報表：

```r
t.test(data = riceYield,
       yield ~ treatment,
       paired = F,
       conf.level = 0.95)
```


- 第2行: 表示資料是將yield依照treatment分組 (A vs B) 比較


- 第3行: 為檢定結果：
  - t  : t 值
  - df :自由度
  - p-value : 表示本次檢定所得 p 值
  p值的表示方式比較特別，用到"e"，e代表10的幾次方：

結論：在$\alpha = 0.05$時，兩品種產量具顯著差異。