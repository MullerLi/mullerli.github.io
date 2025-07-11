# 有計畫的比較平均值

變方分析結果可以告知「平均值之間是否有差異」。我們可以再利用 {agricolae} 中的 `LSD.test` 進行多重比較，就可以做出完整的結果表格。

然而，多重比較並不是具有目的性的探討研究結果，
（林俊隆老師：先進行變方分析，再進行平均值之間的多重比較幾乎成了統計分析的八股）

若研究者在實驗中，對特別處理組之間的比較有興趣，應該要採用「計畫性的對比」，也就是線性對比。線性對比可以自訂不同處理平均值的比較，因此稱為計畫性對比。

在 R 中，計畫性的比較，被歸納為一般線性假說 (General Linear Hypotheses)和模型參數多重比較 (multiple comparisons for parametric models)，可以利用 {multcomp} 套件的 glht 進行。

這個函數也適用於廣義線性模型、線性混合模型、存活模型。

## 計畫性比較-簡單CRD

以`iris`鳶尾花資料集為例，這個資料集包含有三種物種(species)的花萼(Sepal Length)長度。

假設我們想探討三種品種的花萼長度之間是否具顯著差異，可以用下面程式碼分析 (先安裝跟啟用agricolae噢!)，

```r
require(agricolae)
# 建立線性模式
m1 <- lm( data=iris , Sepal.Length~Species)
# ANOVA
summary(aov(m1))
# LSD多重比較
L1 <- LSD.test( m1 , trt = 'Species')
L1$groups
```

上述分析包含兩張報表：

-   以品種為變因的單因子變方分析，結果`Species`的 *P*<0.001，棄卻三個品種效應為零的假說（白話文：三品種的平均值之間有顯著差異），

- LSD檢定顯示三個品種平均值兩兩不同，這個結果基於第一點變方分析的線性模式。

- 因為變方分析顯示品種間具顯著差異，所以進行的LSD檢定屬於「受到變方分析結果保護的保護的LSD (protected LSD)」，第一型錯誤率，經模擬研究，確認是屬於「以試驗為單位的第一型錯誤率」。

若想單獨檢定virginica和setosa之間的差異，或是想知道virginica是不是setosa的1.5倍的計畫性比較呢？

先安裝套件，啟用套件

```r
if (!'multcomp'%in% installed.packages())
{install.packages('multcomp')}

library(multcomp)
```

進行計畫性比較，我們其實是驗證特定線性對比的虛無假說。

-   「virginica和setosa的花萼長度是否有顯著差異」
    -   $H_0:\mu_{virginica}-\mu_{setosa}=0$
-   「virginica的花萼長度是不是setosa的1.5倍?」:
    -   $H_0:\mu_{virginica}-1.5\mu_{setosa}=0$

1.  建立一個比較係數的矩陣，該矩陣稱為"回歸係數矩陣" (matrix of coefficients)。

```r
# 線性模式參數
m1 <- lm( data=iris , Sepal.Length~Species)
print(coef(m1))
```

這個一般線性模式參數包含三項，對應Species的三個等級(Intercept為setosa之效應)


```r
# 利用 rbind 產生一個包含線性對比的係數的矩陣 cp_m
# name 設為 "處理因子的線性對比" 方便稍後呈現
# 係數的順序對應 lm model 模式參數的順序，也就是上方coef(m1)印出的三個物件
# 這個線性對比只能使用coef(m1)中的物件
cp_m <- rbind ( ' 1  se + 0ve - 1vi' = c( 1 , 0 , -1) ,
                '-1.5se + 1ve - 0vi' = c( -1.5 , 1 , 0) )
cp_m

```

2.  以`glht`來計算。這個函數需要輸入線性模式物件、比較係數的矩陣。

比較係數的矩陣可以使用linfct = mcp( `處理` = `矩陣` )表示

另外，本函數預設為雙尾檢定，如果要進行單尾檢定(> or <)，可以加上參數`alternative = c('greater','less')`

```r
glh1 <- glht(m1 ,
             linfct = mcp(Species = cp_m))
glh1
```

使用`summary`察看結果。

```r
summary(glh1)
```

可以看到結果兩個線性對比的 *P*<0.001，所以棄卻兩個虛無假說，得到結論：

* virginica和setosa的花萼長度之間*有顯著差異*
* virginica的花萼長度*不是*setosa的1.5倍


3. glht 亦可用於產生多重比較結果：

```r
gl1<-glht(m1, linfct = mcp ( Species = 'Tukey'))
summary(gl1)
```
'Tukey'亦可置換為c("Dunnett", "Tukey", "Sequen", "AVE", "Changepoint", "Williams", "Marcus", "McDermott", "UmbrellaWilliams", "GrandMean")

`cftest` 檢視模式參數(截距與斜率)是否成立
```r
cftest(m1)
```


  



這個函數也可以用另一種比較簡單，不須建立矩陣的寫法
```r
# 也可以直接輸入線性對比假說的數學式:
# 注意只能包含之間模型參數物件的名稱
# 用coef(m1)檢查模型參數
glht(m1,
     linfct = mcp( Species =
                     c("virginica - setosa = 0")))
```


補充：具有交感項的多重比較法 利用emmeans
```r
library(emmeans)
data("nutrition")
colnames(nutrition)
m2<-lm( gain~race*group ,nutrition)

summary(emmeans( m2 ,
         list(pairwise~group*race),
         adjust='tukey'))
```




## 計畫性比較-複雜資料

接下來利用林俊隆老師書中案例IRRI陸稻殺草劑試驗，資料存放在 riceHerbic
```r
require(tidyverse)
require(magrittr)
riceHerbicide <- read.csv('dataset/riceHerbicide.csv')
riceHerbicide %>% str
```
資料的形態不對，處理的部分被視為`character`，要修正成`factor`

```r
riceHerbicide %<>%
  mutate(treatment = as.factor(treatment),
         applytime = as.factor(applytime),
         rate = as.factor(rate),
         rep = as.factor(rep))
riceHerbicide %>% str
```
接下來可以進行分析

1. 首先建立一個統計敘述表

```r
se<-function(x) return( sd(x)/length(x) )
riceHerbicide %>%
  group_by( treatment , applytime ) %>%
  summarize( across( is.numeric, list('n' = length,'avg'=mean,'se'=se )))
  
```
上表可以看到，控制組(ck)其實產量蠻低的，不到1500，所以殺草劑處理為變因的F檢定很可能是顯著的。

但若是想做計畫性的比較(例如: 比較除草劑效果跟手除效果)，就要用線性對比來分析。

2. 建立線性模式物件

```r
m2 <- lm (data = riceHerbicide , yield ~ treatment + rep )
m2 %>% anova
```
處理間平均值具顯著差異

3. 多重比較
```r
L2 <- LSD.test(m2, trt='treatment')
L2$group
```

多重比較可以看出手除兩次(handweeding twice)不遜於除草劑，而Propanil/Ioxynil除草劑效果比較不好。控制組可能因為雜草叢生，所以產量最低。


4. 線性對比：除草劑效果跟手除效果比較

這裡的處理因子有7個等級，建立矩陣前，先查看這7個等級的順序，再依此建立比較矩陣。

```r
# compaison: CK vs Herbicide
# 因子排列順序
riceHerbicide$treatment %>% levels()
```


```r
# 特定線性模式
glht( m2 , linfct = mcp( treatment = 'Tukey')) %>%
  summary


```



```r
# 特定線性模式
cfm <- rbind(
  '-5hand + Herbicide'     = c( 0 , -5 , 1 , 1 , 1 , 1 , 1 ),
  'hand - Propanil/Bromoxynil' = c( 0 , 1  , 0 , 0 , 0 , -1, 0 ),
  'hand - Propanil/Ioxynil'    = c( 0 , 1  , 0 , 0 , 0 , 0 , -1 ) )

glht( m2 , linfct = mcp( treatment = cfm)) %>%
  summary


```
上表可以看出，手除草的效果其實不遜於除草劑Propanil/Bromoxynil和Propanil/Ioxynil(不論施用時間)。

大家可以多去田裡拔拔草，有益材料生長以及身心健康。




## 模型參數多重比較

利用`emmeans`套件，可以進行模型參數多重比較。

```r
library(emmeans)
data("nutrition")
colnames(nutrition)
m2<-lm( gain~race*group ,nutrition)

summary(emmeans( m2 ,
         list(pairwise~group*race),
         adjust='tukey'))
```