# Network Data Model

## 要約

Network Data Modelは、record typeとpointer linkによってデータを構造化し、あるrecordから別のrecordへpointerをたどって移動するモデルです。かつてdatabaseではRelationalDataModelに押されましたが、メモリ上のデータ構造では今でも主要なモデルです。

object modelもpointerで結ばれたデータ構造を持つため、network data modelの一種と見なせます。ただし、objectはdataとbehaviorを合わせ持つ点が重要な違いです。behaviorをほとんど持たないAnemicDomainModelは、実質的にはnetwork data modelに近いと述べています。

## 読むときの観点

- network modelは、record間の明示的なlinkをたどる発想で理解する。
- databaseの歴史では後退したが、メモリ上の構造では今も中心的である。
- object modelとの違いは、behaviorを持つかどうかにある。
- AnemicDomainModel批判との接続を意識して読む。

## 原文の翻訳

Network Data Modelは、record typeとしてデータを構造化し、あるrecordから別のrecordへnavigateするためのpointer linkを持たせます。したがってNetwork Data Modelにqueryするには、1つのrecordから始め、pointer referenceをたどって移動します。

network model databaseはしばらく前にRelationalDataModelに押されて支持を失いましたが、このdata modelは決して死んでいません。実際、これはメモリ上データの主要なモデルです。ほとんどすべてのmainstream languageには、record typeとpointerを定義する仕組みがあります。

object modelもNetwork Data Modelの一形態だと考えられます。object modelもpointerで結びついたデータ構造を持つからです。重要な違いは、objectがdataとbehaviorを組み合わせていることです。そのため、実際に使うとかなり違った感触になると私は思います。しかし、多くのobject model、つまりAnemicDomainModelは、重要なbehaviorを持たないため、**実質的にはNetwork Data Modelにすぎません**。
