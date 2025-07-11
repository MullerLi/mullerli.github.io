# ANOVA

```r
pkgs <- c('car','MASS','magrittr','tidyverse','lme4','lmerTest','multcomp','agricolae','dplyr','lsmeans','emmeans','psych')
if (!any(pkgs %in% installed.packages())) {install.packages(pkgs[!pkgs %in% installed.packages()])}
invisible(lapply(pkgs , library , character.only=TRUE))
```

當想要了解3個以上平均值之間是否有差異時，可以使用ANOVA(analysis of
variance)，也就是變異數分析。

若當平均值只有2個，計算ANOVA就等同於計算相同變異數相同的T檢定，此時ANOVA計算的F值為T值的平方。

## 前提假設

+---------------+-----------------------------+
| 前提假設      | 檢定(R)                     |
+===============+=============================+
| 常態性        | `qqnorm(y)`                 |
|               |                             |
|               | `shapiro.test(y)`           |
+---------------+-----------------------------+
| 變 異數同值   | `bartlett.test(y~x)`        |
|               |                             |
|               | `leveneTest(y~x)`           |
|               |                             |
|               | `car::ncvTest(model)`       |
+---------------+-----------------------------+
| 殘 差獨立性   | `ca                         |
|               | r::durbinWatsonTest(model)` |
+---------------+-----------------------------+

1.  樣本與誤差具常態性且彼此獨立

$$\epsilon \sim {\sf NID}(0,\sigma^2)$$

2.  變異數同值假設

-   樣本是來自變異數相等的族群，譬如利用某機器量測一群樣本，每次量測時，機器顯示的重量，都會受到機器本身設定的影響，呈現真實值的固定百分比，因此具有這一群樣本會有相等的變異數。

-   當違反假設，且變因是固定型效應，在處理重複數量均衡（彼此相同）時，對Fo僅有微弱的影響；但在處理數不均衡時，則會使顯著水準或型I錯誤率與預期值偏離。當變因是隨機型效應時，不論處理是否均衡，違反假設都會造成極大影響。

### 檢驗方式

1.  常態性檢定：

-   機率分布圖(QQ
    plot)：將殘差計算出來，從大排到小，按數據點在圖形上。如果屬於常態分佈，會像是一條直線，不會偏離太多。

使用`qqnorm`查看QQ-plot

```r
qqnorm(iris$Sepal.Length)
```

可以看出點很貼近線，數據應該符合常態。

-   使用`shapiro.tes`檢定，顯著則代表不符合常態。

```r
shapiro.test(iris$Sepal.Length)
```

因為*P*值不小於0.05，所以得知數據是常態分佈的資料。

------------------------------------------------------------------------

2.  變異數同質的檢定：

-   殘差圖：x軸為配適值(fitted
    value)，y軸為殘差(residuel)作圖。若殘差彼此之間獨立，ϵij畫出的圖不會有結構。喇叭狀代表違反獨立性與變異數均值假設。
-   下圖左上可看出點往右上偏移，配適值和殘差漸大的趨勢。

```r
library(car)
library(ggfortify)
m<-lm(interlocks ~ assets + sector + nation, data=Ornstein)
autoplot(m)
```

-   {car}的`ncvTest`檢定變異數同質，若顯著代表變異數不同質。

```r
m <- lm(interlocks ~ assets + sector + nation, data=Ornstein)
ncvTest(m)
```

-   Barlett's test：顯著代表變異數不同質。
-   Levene's test：顯著代表變異數不同質。

```r
leveneTest(Ornstein$interlocks ~ Ornstein$sector)
```

```r
bartlett.test(Ornstein$interlocks ~ Ornstein$sector)
```

上述兩個檢定皆為顯著，代表變異數不同質。

3.  殘差獨立性

-

```r
durbinWatsonTest(m)
```

## 非常態資料的轉換

下面是常見的資料轉換方式：

1.  開根號
2.  取log
3.  倒數+根號
4.  倒數



```r
data(iris)
# 開根號
iris$Sepal.Length <- sqrt(iris$Sepal.Length)
# 取log
iris$Sepal.Length <- log(iris$Sepal.Length)
# 倒數根號
iris$Sepal.Length <- sqrt((iris$Sepal.Length)^(-1))
# 倒數
iris$Sepal.Length <- (iris$Sepal.Length)^(-1)
```

------------------------------------------------------------------------

5.  Box-Cox轉換：先求$\lambda$值，計算log-likeihood峰值的lambda值，根據$\lambda$對觀測值取一個函數。實際上，Box-Cox轉換就包含了平方根、log、倒數等函數。


利用{MASS}`boxcox`可以計算出$\lambda$值，但是後續取函數部分需要自行作業。

`nboxcox`是一步驟完成常態性檢定與數據轉換的函數，如果數據是常態，就不執行Box-Cox轉換，回傳原始資料；反之，則回傳轉換後數據。


```r
# Box-Cox transform
nboxcox<-function(data , y){
  require(tidyverse)
  require(MASS)
  data_y<-unlist(as.vector(select_if(data[y],is.numeric)),use.names = F)
  shapiro_out <- data_y %>% shapiro.test()
  if (shapiro_out$p.value < 0.05) {
    cat('\n The variable',paste0('\'',y,'\''),'is not normality.\n')
    forMu <- formula( paste0(as.character(y),'~1'))
    bc    <- boxcox(forMu,data = data)
    lambda<- bc$x[which.max(bc$y)]
    if (lambda != 0){
      newy <- (　data_y^(lambda)　-1)/lambda
      print(newy)
    }else if(lambda == 0 ){
      newy <- log(data_y)
      print(newy)}} 
  else if(shapiro_out$p.value >= 0.05){
    cat('The variable',paste0('\'',y,'\''), 'is normality.\nReturning original data.\n')
    return(data_y)}} 
```

```r
# 範例
nboxcox(iris,'Sepal.Length')

# 範例
transformed_data<-nboxcox(iris,'Sepal.Length')
```

## 線性模式

隨機設計(complete design, CRD)、完全隨機區集設計(random complete
block design,
RCBD)等試驗設計，是將觀測值套入線性模式(y=ax+b的數學式)裡面來分析。

舉例來說，1個包含3種水稻品種產量試驗，採用CRD，可以寫成下面線性模式：

$$Y_{ij}=\mu+\alpha_i+\epsilon_{ij}$$

換句話說： $$A品種產量 = 產量總平均值 + 品種A的影響 + 隨機誤差$$
$$B品種產量 = 產量總平均值 + 品種B的影響 + 隨機誤差$$
...

品種A和品種B是影響產量變化的主要原因，因此稱為變因。在R中，線性模式可用`formula`表示。

總平均跟隨機誤差可以不用寫，直接寫變因即可。以`as.formula`指定一個該物件為`formula`。

```r
as.formula(yield ~ variety)
```

`formula`物件的左方為觀測值，通常是數量資料；右方是影響觀測值的變因(類別型)或是共變異數(連續型)。不同的試驗設計就會有不同的線性模式，只包含處理的話就是CRD、包含區集就是RCBD、包含多因子與交感就是復因子試驗。較複雜的設計(像是套層、裂區、條區)，也有不同寫法。

```r
# CRD
yield ~ A

# RCBD
yield ~ A + block

# Factorial Experiments
yield ~ A + B + A*B + block

# Nested Design
yield ~ A + B + A:B
```

## ANOVA

利用`aov`或`anova`都可以產生變方分析表

```r
library(tidyverse)
data(iris)
# aov 可直接輸入formula，但需要用sumary提取結果
aov(Sepal.Length~Species ,iris) %>% summary

# lm物件創建線性模式物件，anova則對該物件進行ANOVA
lm(Sepal.Length~Species ,iris) %>% anova
```

我習慣用`lm`+`anova`，因為可以用`data.frame`轉成表格，方便輸出成csv檔。

```r
lm(Sepal.Length~Species ,iris) %>% anova %>% data.frame
```


-   最左方`Species`和`Residuals`是變因，自由度是n-1及n-a

-   `Species`變因的p<0.05，代表3個鳶尾花品種間的花萼長度`Sepal.Length`具有顯著差異

-   `Residuals`是試驗的誤差、殘差項

## LSD檢定

LSD檢定是Fisher's least significant different
test的縮寫，是農業研究慣用的事後檢定(post-hoc test)方法。

LSD利用ANOVA的MSE(誤差均方)進行兩兩平均值之間的t檢定，當兩兩平均值差超過LSD值時，代表兩平均值之間具有顯著差異。

$$LSD =  t_{\alpha/2,df}\sqrt{MSE(\frac{1}{n_1}+\frac{1}{n_2})} $$


利用{agricolae}的`LSD.test`就可以完成計算

```r
library(agricolae)
rice <- read.csv('dataset/riceYield.csv')
# 產生model物件
mod1 <- lm(yield ~ loc*var+rep,rice)
# LSD檢定
L1 <- LSD.test(mod1 , trt = 'var')
L1$groups
```

上式進行'var'之間的比較，但當因子交感作用顯著時，不能比較單一變因等級之間(V1與V2)的平均值，應該要做因子組合之間的交感比較。

```r
# 變因品種var不顯著，栽培地區loc顯著
# loc:var交感顯著
anova(mod1)
```

```r
LSD.test(mod1 , trt = c('loc','var'))$group
```

比較兩張表，可看出品種(`var`)受交感效應影響，在產地(`loc`)A時V1產量高於V2、B產地V2產量高於V1



## 產生資料表

接著要將計算結果輸出到excel中，結果要包含平均值、標準差(standard
error)或平均值的標準差(standard error of the
mean)其一、LSD比較分組結果，如下表：

![LSD表](image/lsdtable.jpg)


以上`riceYield`為例，要先產生敘述統計表，再把LSD結果合併。

`LDS.test`回傳的結果已包含這些資料

```r
L1 <- LSD.test(mod1 , trt = c('loc','var'))
d1<-data.frame(trt = rownames(L1$means) ,
               'mean' =L1$means[1],
               'x'='±',
               'SEM'=L1$means[2])
d2<-data.frame('trt'=rownames(L1$means),
               L1$groups[2])
o<-merge(d1,d2,by='trt')
o

```


上面資料分析過程可以整合成一個函數：`dlsd`，該函數是從讀取`data`直接算到`LSD`。

這個函數包含四個參數，會回傳ANOVA與LSD結果


* dat: `data.frame`物件名稱
* lm_formu: ANOVA的formula
* treatment: LSD分析的分組變因；可以用c()包含多個變因
* to_csv: 是否要將資料輸出到D槽底下? (`T` or `F`)

```r
# 執行一次就好
dlsd <-function ( dat , lm_formu , treatment , to_csv = F){
  require(agricolae)
  require(tidyverse)
  data_name <- deparse(substitute(dat))
  model <- lm(data = dat , formula = lm_formu)
  o <- as.data.frame(anova(model))
  colnames(o) <- c('DF','SS','MS','F','P')
  df1 <- o %>% mutate('Sig'= case_when( P > 0.1 ~ 'ns',
                                        P > 0.05 & P <= 0.1 ~ '*',
                                        P > 0.001 & P <= 0.05 ~'**',
                                        P > 0 & P <= 0.001 ~ '***',
                                        TRUE ~ 'NA') ,
                      'Response' = all.vars(lm_formu)[1]) %>%
    mutate(across(where(is.double) , ~round(.x,digits = 4)))
  x <- LSD.test( model , trt=  as.character(treatment))
  Var <- row.names (x$groups)
  newGroup <- data.frame ( Var , x$groups[,1:2] )
  sort <- newGroup [ order ( newGroup$Var ), ]
  rownames(sort) <- c()
  df2 <- data.frame (sort,
                     "N"   = x$means [,3],
                     "SEM" = x$means[,2]/sqrt(x$means[,3]),
                     "SD"  = x$means[,2],
                     "CV"  = x$means[,2]/x$means[,1]) %>%
    mutate(across(where(is_double),~round(.x,digits=2)))
  names(df2) <- c( "Factor","Mean", "Sign","n" , "SEM",  "SD" ,"CV")
  listout <-list(df1,df2)
  if(to_csv == TRUE){file_name <- paste0('ANOVA_',paste0(data_name),"by",all.vars(lm_formu)[1],format(Sys.time(), "%m%d%H%M%S"))
    path <- paste0('D:/',file_name,'.csv')
    listout %>% capture.output %>% write.csv(path)
    cat('\n Data had been outputted to', path,'\n \n')
    return(listout)}else if (to_csv == FALSE) {return ( listout )}
    }
```



```r
dlsd(rice,
     lm_formu = yield~loc*var+rep,
     treatment=c('loc','var'),
     to_csv = F)
```