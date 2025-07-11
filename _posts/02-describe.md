# 敘述統計

這一章節的目的是介紹如何讀取資料，將資料進行簡單的統計量計算分析，例如平均值、樣本變異數、樣本數等等。

## 資料格式

統計分析的資料，以 Excel 檔整理成以下格式，並統一存成 UFT-8 編碼的 csv 檔。

csv 檔可以用 Excel 檔開啟，因此，一旦將寫在紙上的原始資料 (raw data) 輸入到 Excel 中，再轉存成 .csv檔，就可以直接由 R 讀取，相當方便。

![R也看得懂的Excel表](image/excel.png)

這樣的資料在R裡面會長這樣(不建議在資料表中輸入中文字)

```r
(df<-data.frame(
  '處理' = rep(c('A','B'),each=5),
  '產量' = c(10,10,15,12,15,30,35,65,44,55)
))
```

上方印出的東西稱為資料表 (dataframe)，資料表由2個變數 (variables)處理與產量組成。變數名稱所在的位置稱為欄位 (columns)，欄位是有順序的，在上表中，第1欄為處理、第2欄為產量。每個欄位下面都有資料值 (values)，稱為觀測值 (observations)，觀測值左方的數字為列 (row) 數，可以看到這筆資料有2欄10列。

在開始前，請下載[此檔案](/dataset/iris.csv)，將其存放在D 槽底下。

## 讀取資料

使用`read.csv`函數

```r
iris_df <- read.csv( file = 'D:/iris.csv' )
```

上方指令的意思是，讀取 csv 檔，檔案放在D槽底下，名稱為iris.csv (`file = 'D:/iris.csv'`)，而我想要幫這個資料表取名為`iris_df`

箭頭 (<-) 在 R 中是代表賦值 (assign) 的操作子 (operator)，意思是把"箭頭右方"的物件，放入"箭頭左方"的物件中。

如果左方物件(iris_df)是全新的、沒有指派物件的東西，執行程式碼之後，箭頭右方的物件(`read.csv( file = 'D:/iris.csv' )`)就會變成左方的名稱。（從今天開始你的代號就是9527！）

```r
快龍的招式 <- '破壞死光'
快龍的招式 <- '千變萬花'
print(快龍的招式)
```

另外，使用`file.choose()`可以指定檔案的路徑，配合`read.csv`可以不輸入太多東西的情況下讀取檔案
```r
data <- read.csv(file.choose())
```

2.  物件命名有兩個主要規則：

-   底線：例如 my_data、iris_df、rice_yield，兩個全為小寫的單字以底線區隔
-   駝峰：例如 myData、irisDf、riceYield，兩個小寫的英文單字，但第二個單字開頭為大小字母。

## 敘述統計量表

產生敘述統計量表格的方式應該有千萬種，這邊介紹2種方法。

{psych} 套件的 `descrieBy`和`describe`

1.  安裝 {psych} 並啟用

```r
# 檢查有無安裝，若無則繼續安裝套件
if('psych'%in%installed.packages() == FALSE) install.packages('psych')

# 啟用
library(psych)
```

2.  輸入`describe`

```r
# 產生敘述統計表
# 使用範例資料集 mtcars (一個車子雜誌的資料)
psych::describe (mtcars)
```

這裡你可能會覺得疑惑，報表內的`median`我還看得懂是中位數，那`trimmed`是什麼? 切碎的蠍子嗎?

當對函數的功能有疑惑時，只要在函數前面輸入 `?` 再執行，就可以讀取該函數的說明文檔。

文檔內會包含使用函數的方式、函數吃什麼參數、會吐什麼樣的結果、以及程式碼範例。在文檔中可以找到 "trim=.1 -- trim means by dropping the top and bottom trim fraction"，也就是去掉數據最大值與最小值後取的平均值。

```r
?describeBy
```

3.  分組敘述統計與輸出

上表計算所有變數(mpg, cyl, disp...)的敘述統計量。如果要計算手排或自排 (vs = 1,0) 及汽缸數 (cyl = 4,6,8) 不同組合的敘述統計量，就要用到分組。

我最常使用`tidyverse`來進行分組計算。

啟用套件

```r
pkg<-'tidyverse'
if(pkg %in% installed.packages() == F) install.packages(pkg)
library(tidyverse)
```

產生分組敘述統計表。

```r
mtcars %>%
  group_by ( vs , cyl ) %>%
  summarise( across ( where( is.numeric) , list('avg'=mean, 'sd'= sd ))) %>%
  round(digits = 2)
```

這邊用到的是`tidyverse`中`dplyr`和`magrittr`套件的數個功能。

-   `%>%`: 管線子(pipe)

執行一次分析，會用到非常非常多函數`f(x)`，下意識可能會這樣寫。

```r
# 產生100個隨機數字
x <- rnorm (100)
# 取絕對值(abs)、開根號(sqrt)、四捨五入到小數點後第二位(round)、顯示前6筆
x1 <- abs(x)
x2 <- sqrt(x1)
x3 <- round(x2 , digits = 2)
head(x3)
```

或是這樣，這是所謂的巢狀函數。

```r
# 產生100個隨機數字、取絕對值(abs)、開根號(sqrt)、四捨五入到小數點第二位、顯示前6筆
head(round(sqrt(abs(rnorm (100))),2))
```

這樣寫起來既冗且不清楚，但用管線子可以讓代碼看起來比較清晰好懂。

```r
rnorm (100) %>%
  abs %>%
  sqrt %>%
  round( . , digits = 2) %>%
  head
```

-   `%>%`將資料由左往右傳
-   `.`代表左方傳入物件的位置
-   `%>%` 右方的函數可不加括號
-   行與行之間用 Enter 換行，看起來比較舒服
-   在 RStudio 中，`%>%`輸入快捷鍵是ctrl+shift+m

2.  `group_by( 分組變數A , 分組變數B , ... )`

3.  `summarize( across ( 條件判斷 , list ( 敘述統計函數1 , 敘述統計函數2 )))`


最後使用`write.csv`將資料分組計算後輸出
```r
mtcars %>%
  group_by ( vs , cyl ) %>%
  summarise( across ( where( is.numeric),
                      list('avg'=mean, 'sd'= sd ))) %>%
  round(digits = 2) %>%
  write.csv(., 'D:/summary.csv')
```