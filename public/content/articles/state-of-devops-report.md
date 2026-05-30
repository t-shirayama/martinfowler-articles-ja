# State Of Dev Ops Report

## 要約

State of DevOps Reportは、software delivery organizationに有効なpracticeを、survey dataの統計分析から探る年次reportです。特徴的なのは、delivery performanceをDeployment Frequency、Lead Time、Time to Restore、Change Failure Rateという4つの指標で捉え、組織をelite、high、medium、lowに分類している点です。

Fowlerは、elite performerが高頻度かつ短いlead timeでdeployしているにもかかわらず、安定性を犠牲にしていない点を強調しています。高いthroughputと高いstabilityは対立するとは限らず、優れたdelivery capabilityは両方を改善し得る、というのがこの記事の中心です。

## 読むときの観点

- 「文化」や「capability」のような直接測れないものを、surveyでどう推定しているのか。
- software delivery performanceを、速度だけでなく復旧や失敗率も含めて見る意味。
- elite performerの結果を、自組織の改善仮説としてどう読み替えるか。

## 原文の翻訳

State of DevOps Reportは、software delivery organizationにとって有効なpracticeを明らかにするため、survey dataを統計的に分析する年次reportである。主な著者はNicole Forsgren、Jez Humble、Gene Kimである。

このreportは、何万人ものprofessional software developerを対象にしたsurveyに基づいている。質問は、組織文化のように直接は測定できないconstructを特定するために設計されている。ここでのconstructは、continuous integrationのようなpracticeや、team cultureのような環境要因を含む、software delivery organizationのcapabilityを表す。

surveyでは、「continuous integrationをしていますか」と直接聞くのではなく、CIの一部である具体的な行動を尋ねる。直接的な自己申告は信頼しにくいからである。そのうえで、さまざまな統計手法を使い、質問が本当に背後の概念を測っているかを検証する。さらに分析を進めることで、それらのconstruct同士がどう関係しているかについての仮説も検証できる。

この調査で特に印象的なのは、software delivery performanceによってteamがelite、high、medium、lowの4段階にcluster化されることである。elite performerは一日に何度もdeployし、developerが完了した変更を1時間未満でproductionに届ける。一方、low performerでは変更をproductionに出すまでに数か月かかる。

重要なのは、この高いthroughputがsystem stabilityを犠牲にしていないことだ。elite teamのchange failure rateは15%未満であり、low performance teamの46-60%と比べて低い。また、障害からの復旧も、weeksではなくminutesで行える。

2019年reportの4つのkey metricsは次のように整理される。

| 指標 | elite | high | medium | low |
| --- | --- | --- | --- | --- |
| Deployment Frequency | on demand（1日1回超） | 1時間から1日 | 1週間から1か月 | 1か月から6か月 |
| Lead Time | 1日未満 | 1日から1週間 | 1週間から1か月 | 1か月から6か月 |
| Time to Restore | 1時間未満 | 1日未満 | 1日未満 | 1週間から1か月 |
| Change Failure Rate | 0-15% | 0-15% | 0-15% | 46-60% |

reportは、調査対象の組織をこの4つのkey metricsの類似性に基づいてcluster化した。Deployment Frequencyはproductionにcodeをdeployする頻度、Lead Timeはcode commitからproductionで正常に稼働するまでの時間、Time to Restoreはdefect発生後にserviceを復旧する時間、Change Failure Rateは修復対応を必要とする問題を引き起こした変更の割合を表す。

さらに深く読むには、2019 State of DevOps Reportや、調査結果と分析手法を詳しく説明したAccelerateが出発点になる。
