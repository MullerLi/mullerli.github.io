# 為什麼要用R?

以下引用Advanced R的[Why R](https://adv-r.hadley.nz/introduction.html)，說明使用R的好理由:

-   R完全免費而且開源。

-   R的社群相當多元而且樂於討論。

-   R有大量的統計分析、機器學習、數據視覺化、資料整理套件，任何想做的數據分析，幾乎已有人寫好程式碼與教學。

-   R也有工具可以分享結果，例如[RMarkdown](https://rmarkdown.rstudio.com/)可以將資料分析結果輸出成文件、簡報、動態網頁；[Shiny](https://shiny.rstudio.com/gallery/)可以製作精美的互動網站。

-   R包含最先進的統計分析與機器學習工具，而且不斷進化。

-   RStudio公司開發好用的R工具並販售，然而，現在已經將獲利逐漸回饋給R的公共社群。其中50%的工程師在RStudio做的是開放原始碼的專案。

-   R學習難度低、上限高，甚至可以在R中利用C、Fortran、C++語言加速程式執行流程。


---


但R也有缺點，例如

-   多數R使用者並非專業軟體工程師，許多野生的R程式碼都是為了快速解決問題而寫，不優美而且難懂。

-   R的社群更專注在分析過程及結果，對達成軟體工程的知識實踐是零散的。例如沒有足夠多的R程序員使用源代碼控制(source code control)或自動化測試(automated testing)。

-   太多的 R 函數使用技巧來減少輸入程式碼，導致程式碼難以理解，並且可能以意想不到的方式失敗。

-   R 的程式語言包(packages)品質不一，有太多的特殊情況需要記住，導致每次使用 R ，你都會面臨超過 25 年的演變，這會使學習 R 變得困難。

-   相較其他程式語言，R 執行效率低而且耗用電腦資源，糟糕的 R 程式碼可能會執行速度很慢。


![如果統計程式是一台車](image/rmeme.jpg){width="500"}[from reddit](https://www.reddit.com/r/rstats/comments/dn7fa7/i_thought_the_if_stats_programs_were_cars_meme/)

## 下載與安裝R

下載與安裝

[R](https://cran.r-project.org/)


[RStudio](https://posit.co/download/rstudio-desktop/)


R是必須要安裝的，否則沒辦法使用。RStudio則是R語言的"整合開發環境' (Integrated Development Environment, IDE)。


[這裡](https://joe11051105.gitbooks.io/r_basic/content/environment_settings/RStudio_introduction.html)有更詳細的RStudio環境介紹。



## 第一個R程式碼

複製下面程式碼，貼上至R console，按下Enter；或是在 RStudio 中開啟新的script，貼上程式碼將輸入游標在同行按Ctrl+Enter。

這是你的第一個R程式碼，嗨，世界!


```r
print('Hello world!')
```



以下章節都會包含程式碼 (灰框上方) 與執行結果 (灰框下方)，灰框右上方有複製按鈕，點選就可以直接複製程式碼，貼上在R介面中執行。


你會發現，R很像是Google助理，輸入一行指令，執行後就會返回一行結果，這種一來一往式的程式語言叫做直譯語言(interpreted language)。但一段 R 的程式碼可能會有很多行，譬如下面畫圖的函數，就包含許多行程式碼。 　 　



### 第一張圖

你可以將下面程式碼複製後，整個貼到你的RStudio介面或是R中執行，畫出你的第一張圖：

```r
pkg <- 'ggplot2'
if ( !pkg %in% installed.packages()) install.packages(pkg) 
library(ggplot2)
ggplot(data = iris, mapping = aes(x = Sepal.Length, y = Petal.Width, color = Species))+
  geom_jitter()+
  geom_smooth(method='lm',se=F)+
  theme_bw()+
  labs(x='花萼長度(cm)',
       y='花瓣寬度(cm)',
       color = '品種',
       title = '鳶尾花花萼長與花瓣寬線性關係')
```

上面是利用`ggplot2`套件和內建資料`iris`畫成的圖，後面章節會介紹如何畫圖。

像`iris`這樣的資料集，在安裝好R的當下就已經同時安裝好，我們稱為[範例資料集](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/00Index.html)，可以用`data()`查看有哪些可利用的資料集。

## 學習地圖(Roadmap)

現在許多R的教程會直接建議從{tidyverse}學起，譬如以下這篇訪問，RStudio創辦人 J.J. Allaire(簡稱JJ)接受 Joseph B. Rickert(簡稱JBR)[訪問](https://cosx.org/2016/11/interview-j-j-allaire/)也提到這一點。

---
```
JBR: 對於初次接觸 R 的人，您有什麼建議嗎？無論是學生、經驗豐富的統計學家還是研究人員？

JJ: 我會建議他們練習一下 Hadley Wickham 和 Garrett Grolemund 在 [“R for Data Science”](https://r4ds.had.co.nz/index.html) 這本書中的寫的 R 程式碼。這本書詳細說明了在 R 中處理資料的 tidyverse 和基本原則。R 中有很多很好的工具，但並不是每個用 R 的人都能立刻找到這些工具。這正是我們試圖改變的。我還建議 R 的新手仔細看看我們在 RStudio 開發的所有工具和包。

此外，當你有問題或遇到問題千萬不要放棄。在 StackOverflow 和其它地方有很多很有用的關於 R 的資訊，如果你仔細看它們的話，你有機會找到你的問題的答案。

JBR: 您認為統計學家和資料科學家大體上應該知道哪些關於電腦科學的知識呢？

JJ: 這是個有趣的問題。許多關於 R 的最普遍的看法和思考都圍繞著 Bo Cowgill 那著名的言論：“R 最好的地方在於它是由統計學家編寫的，R 最糟的地方也在於它是由統計學家編寫的。” 

然而事實上，R 的開發者們對程式設計和電腦科學相當瞭解。他們的目標一直都是提供一個讓掌握很少的電腦科學知識的人能實現想法的表示式語言。R 努力提供一種介面和語法，使得不懂電腦科學的人也可以使用 R 做一些複雜的資料分析。

我認為總會存在一些不能用高級的指令解決的問題。所以學習基本的程式設計原則，做一些簡單的計算或者文字分析和語法分析這之類的事是有用的，但是 R 的重點還是不強迫每個人都成為電腦科學家。
```

---

### 參考書

我買過R跟Python的參考書，但我認為R語言奠基在一個不斷進化的基礎上，而且最好的R語言參考書正是以Git book電子書的形式免費發行在網路上供人閱讀，因此花錢買書並不太划算。

這邊提供一些有名的參考書。


-   [R for Data Science](https://r4ds.had.co.nz/index.html) by Hadley Wickham and Garrett Grolemund。 [Hadley Wickham](https://hadley.nz/)是[RStudio](https://posit.co/download/rstudio-desktop/)的工程師，基本上也是R語言的耶穌。他讓R語言變得更容易使用，這本書介紹R資料科學，也是我的第一本教科書。
-   [R for Data Science 第二版](https://r4ds.hadley.nz/) 好書的第二版一定也是好書(🦐挺起來)。

![R4DS](image/R4DS.png){width="200"}



-   [Advanced R](https://adv-r.hadley.nz/introduction.html) 當你有一段三行以上的程式碼要一再複製貼上重複使用，就要考慮使用函數。這本書介紹除了函數編程(functional programming)以外也介紹R的物件導向編程(object-oriented programming)


![Advanced R](image/ADVR.png){width="200"}


-   [阿好伯的文章](https://hackmd.io/@LHB-0222/LearningR?type=view#) 中文且品質非常好的文章!

-   [知乎](https://zhuanlan.zhihu.com/p/143005986) 中國的知識家，和臺灣的知識家水準完全不一樣，有非常多高參考價值的文章值得一讀。


---


有結果後就可以準備輸出，這時可以用R忍者[謝益輝](https://yihui.org/cn/vitae/)開發的套件，下面是這些套件的使用說明書：

-   [RMarkdown Cookbook](https://bookdown.org/yihui/rmarkdown-cookbook/)


![RMC](image/RMC.png){width="200"}


-   [bookdown: Authoring Books and Technical Documents with R Markdown](https://bookdown.org/yihui/bookdown/)


![BDC](image/BDC.jpg){width="200"}


另外是{RMarkdown}的替代方案[Quarto](https://quarto.org/)，可以用來產生簡潔易懂的程式碼與報告。


[R for Data Science 第二版](https://r4ds.hadley.nz/)也有專文介紹[Quarto](https://r4ds.hasdley.nz/quarto.html)。


-   [資料科學與R語言](http://yijutseng.github.io/DataScienceRBook/index.html) by 曾意儒老師，中文版免費的R教科書。

-   [TIDY MODELING WITH R](https://www.tmwr.org/) 有關資料建模。

-   [Bookdown Gallery](https://bookdown.org/)利用Bookdown建立的好書網站。