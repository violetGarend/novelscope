"use client";

import { useCallback, useEffect, useState } from "react";
import { ProgressBar } from "./ProgressBar";
import { ReportCard, ErrorReport } from "./ReportCard";
import { EvaluationHistory } from "./EvaluationHistory";
import { useHistoryStore, selectEntries } from "@/stores/history-store";
import {
  useEvaluationStore,
  selectText,
  selectPhase,
  selectCurrentStep,
  selectCurrentStepName,
  selectResult,
  selectErrorMessage,
  selectSetText,
  selectResetToIdle,
  selectSubmitEvaluation,
} from "@/stores/evaluation-store";

const SAMPLE_TEXTS = [
  {
    label: "第1章（荒年）",
    text: `# 第1章 睁眼就是荒年

姜晚被疼醒。胃像有只手在拧。

头顶是黑的，屋顶破了个洞。身下稻草硌得背疼。

她坐起来，眼前发黑。粗布衣裳打着补丁。记忆冲进脑子：大昭国天盛四年，柳河村。丈夫打猎摔死了，留下婆婆、五岁儿子、三岁女儿。断粮半个月。原主饿死的。

姜晚掐了一下虎口。疼。

"不是梦。"

"娘。"

她转头。灶台边蹲着个小男孩，瘦得颧骨凸出来。旁边缩着个更小的丫头，脸黄黄的。

"石头。"

"娘，你醒了。你睡了好久。"

"多久了？"

"一天一夜。"

"娘……"小丫头爬过来，两只小手张开着。姜晚伸手把她搂过来，轻的，跟一把柴火似的。

"肚肚饿。"

"娘知道。"

"妹妹一直叫你。你一睡着她就叫。奶奶喂汤，她不喝。"

"你喝了吗？"

"喝了。"

"好喝吗？"

石头没说话。

门口进来一个人。头发花白的老妇人端着一只碗。

"晚娘，你醒了。"

碗里清汤寡水，漂着几片灰绿色的。

"这是啥？"

"树皮。煮烂了也能垫垫肚子。你喝了没？"

"我喝过了。"

石头看一眼那碗汤，舔舔嘴唇。"奶奶喝的是水。"

"石头！"

"水？"姜晚看着她。

"我喝不喝都行，你们娘仨吃饱……"

"你比我更需要吃。"

"我是老骨头了，饿两顿没事。"

"饿两顿没事？"

姜晚站起来，扶着墙走到灶台边，掀开锅盖——半锅混着树皮的灰绿色水。

"就剩这些了？"

"米缸早空了。"

"多久了？"

"半个月前就没粮了。你上山薅野菜，后来野菜也薅光了。王婶家昨天也断顿了，她家老头子饿得起不来……造孽啊。可怜见的，这日子啥时候是个头。村里都这样。"

"好几家都这样。"

"爹也饿死了吗？"石头问。

"爷爷是病死的。"

"不是饿死的？"

"不是。"

"那咱家谁会先饿死？"

"石头！"周桂兰声音大了。

石头低下头，不说话了。

姜晚打开灶台上的小布袋。半把野菜种子，干瘪的。

"这能种吗？"

"种是能种，就是长起来要十来天。"

"十来天吃啥？"

周桂兰没吭声。

"娘，我不饿。给妹妹吃吧。我大了。"

姜晚看着他——五岁，瘦得脖子青筋暴起。

"你哪大了？"

"我比妹妹大。"

穗儿探出头："哥哥大。"

"晚娘，你也别太愁。"

"愁有啥用。我想想办法。"

姜晚说完，眼前一花。一块半透明光幕弹出来。她往后一退，撞上灶台边沿。

"娘？你咋了？"

"没事。"

光幕还在。她掐了一下胳膊。疼。不是幻觉。

"晚娘？"

"没事。真没事。"

光幕上是大字——「丰年系统已绑定」。下面三栏：植物加速、批量收获、兑换商店。右下角一行小字：「今日剩余次数：3次」。

姜晚盯着那个"3"。伸手去碰——指尖穿过去了。

"娘，你盯着那儿看啥？"

"没啥。"

"你刚才发呆。"

"想事情。"

"想啥？"

"想怎么不饿肚子。"

"能吗？"

"不知道。试试。"

"试啥？"

"种东西。"

"现在种？来不来得及？"

"不试咋知道。"

"那我能帮你吗？"

"能。你看好妹妹。"

"娘，去哪儿？"穗儿拽了拽她的衣袖。

"后院。种菜。"

"穗儿也去。"

"行，都来。"

外面天亮了。后院有块空地，两米见方，土是松的。

"那儿种过东西？"

"种过。你之前种了点青菜，后来天旱，全枯了。现在能种吗？就是没种子了。"

姜晚举起手里的布袋。"这不是有吗？"

"那点种子，种出来也撑不了几天。"

"撑一天是一天。"姜晚蹲下来，抓了一把土。凉的，潮的。

"可没粮了啊，种了也来不及。"周桂兰搓了搓手。"老天爷哟，这可咋整……"

"来得及来不及，种了再说。"

石头蹲在她边上。"娘，种子真能长出菜来？"

姜晚低头看了看手心里的种子。干瘪的，灰绿色的。她捏了一颗，看了半天。

"能。"

"要等多久？"

"一会儿就知道。那我能看着吗？"

"能。"

姜晚走到菜地前蹲下来，把种子倒在手心里。她深吸一口气，拉开系统面板。手指悬在"植物加速"上。

"娘，你手抖啥？"

"没抖。"

"抖了。我看见的。"

"那是风。"

"没风啊。"

"石头，别吵吵。娘要干活了。"

"哦。"

姜晚按下去。一道微光从她手心漫进土里。

"娘！土亮了！"

穗儿伸出小手指去戳。"热热的。"

"别碰。"

"为啥？"

"烫。"

"不烫了。"

"那也别碰。"

土里的光暗下去。一根嫩芽顶了出来。

"娘！小草长出来了！"

"嘘——"

嫩芽往上窜，伸叶子，一片两片，嫩绿嫩绿的。姜晚伸手碰了一下。软的，活的。

"娘，这是你种的？一下就长出来了？你不是刚撒种子吗？"

"嗯。"

"这也太快了吧！"石头碰了一下叶尖。"软的。"他咧嘴笑了。

穗儿也凑过去摸。"凉凉的。"

"那不是凉，那是嫩。"

"嫩是啥？"

"嫩就是……"石头挠了挠头。"反正就是嫩！"

"嫩就是刚长出来。"姜晚说。"去拿碗来。"

"干啥？"

"装菜。"

石头爬起来，跑进屋。姜晚伸手掐了一把菜叶。

石头端着一只空碗跑回来。"娘，碗！"

姜晚接过碗，把青菜放进去。"够你妹妹吃一顿。"

"娘，煮菜吗？"穗儿揪着她的衣角。

"煮。"

"穗儿想吃。"

"知道。马上就好。"

周桂兰看见她端着碗回来，愣住。"地里摘的？"

"嗯。"

"那地不是刚……"

"长出来了。"

姜晚走进灶房，生了火，下了水，把青菜放进去。没有盐。没有油。白水煮菜。

穗儿蹲在灶台边，盯着锅。"娘，香。"

水还没开呢。

"好了没？"

"快好了。"

"穗儿等不及了。"

"我肚皮贴后背了。"石头说。

"马上就好。"

锅里的水咕嘟咕嘟冒泡了。姜晚夹了一片菜叶，吹了吹，递给穗儿。

"尝尝。"

穗儿接过去，咬了一口。"烫！"

"慢点吃。"

穗儿呼呼吹了两下，又咬了一口。

"香不香？"石头凑过去问。

穗儿点点头，嘴里塞得满满的。"娘，还要。"

"明天还种？"

"嗯。明天还吃菜菜？"

"嗯。"

"好！"

姜晚又夹了一片，递给石头。

"给。"

石头看了看菜叶，又看了看她。"娘，你吃。"

"娘有。"

"有啥？你还没吃呢。"

"娘一会儿吃。"

石头把菜叶撕成两半，大的那半递回来。"那你吃一半。"

姜晚愣了一下。穗儿也从碗里夹了一片，举到她嘴边。"娘，吃。"

姜晚看看石头，又看看穗儿。周桂兰别过脸，拿袖子擦了擦眼睛。

穗儿靠在姜晚腿上，揪她衣角上的线头。
姜晚低头看了一眼。
穗儿没抬头，揪了一根，又揪了一根。

姜晚伸手，把她后脑勺的碎发拢了拢。穗儿没动，揪了一会儿，手停了。

姜晚收回手。

咬了一口穗儿递过来的菜叶。没盐，没油，有点苦。她咽下去了。

"好吃。"`,
  },
  {
    label: "第7章（现代）",
    text: `第1章 这福气给你，你要不要？
七月的南京，热得像蒸笼。

姜池左手拎着两袋子菜，右手攥着手机，屏幕上"妈"的来电还没挂断，声音已经噼里啪啦炸出来。

"买个菜磨蹭半天！你弟复习到现在还没吃上饭，饿坏了你负得起责吗？"

姜池把手机夹在耳朵和肩膀之间，腾出手去掏钱。菜市场摊主叼着烟，斜眼看着她挑的那块肉。

"二十三块八。"

"不是二十一斤吗？这块最多一斤出头——"

"爱买不买，后面排着队呢。"摊主把烟头往地上一摁，伸手就要把肉拿回去。

姜池咬了咬嘴唇，选择了忍耐。

她今天身上只剩三十块钱。打车回来花光了实习工资，爸妈说"家里不缺你那点钱"，转头就把她的工资卡收走了。

说是替她攒着。

攒了四年，密码是她弟的生日。

"到底要不要？"摊主不耐烦了。

姜池张了张嘴，刚想说"要"。

脑子里忽然炸开一个声音。

"要个屁！"

姜池整个人僵在原地。

那声音中气十足，带着一股说不出的……烟火气。像一个在厨房里骂了几十年学徒的老厨子，看到了不可回收垃圾。

"这猪是昨晚杀的，肉色发白，纹理松散，明显放血不净。他用湿布裹了一晚上，就敢当鲜肉卖？"

姜池："……谁在说话？"

"你祖宗！"

她下意识低头看手机，屏幕上的通话还亮着，但她妈的声音已经变成了背景噪音。

那个声音还在继续，越说越气。

"姜家的后人，连猪头肉都分不清？！二十三块八买这玩意儿回去，你是嫌你弟命长还是嫌我姜家菜刀不够快？"

姜池的大脑一片空白。

她下意识说了一句："那我怎么办？"

摊主以为在问他，笑一声："没钱就别买，害我浪费表情。"

脑子里那个声音炸了。

"让他把后面那盆端出来！第三排架子下面，用白布盖着的！那才是今早杀的！快去！"

姜池也不知道自己怎么了，鬼使神差地开口："后面那个盆，白布盖着的，端出来让我看看。"

摊主脸色变了。

"什么盆？没有。"

他的反应让姜池心里咯噔一下。

她试探着往前走了一步，那摊主下意识往架子前面挡了挡。

这下连旁边买菜的大妈都看出不对了，伸着脖子往后面瞅。

"小伙子，你藏什么呢？"

"没什么！"

姜池没再说话。她直接绕过摊主，弯腰掀开了第三排架子下面那块白布。

一盆鲜红的五花肉，纹理分明，还带着刚宰杀不久的热乎气。

脑子里那个声音哼了一声。

"看到了？这才叫肉。那块发白的，最少放了一天半。他专门拿来糊弄你们这种不会挑的年轻人。"

姜池把盆端出来，放在摊主面前。

"我要这个。二十一斤。"

摊主的脸一阵红一阵白，嘴唇动了动，最后什么都没说出来。他闷头切肉、称重，收钱的时候头都不敢抬。

姜池接过找零，拎着肉转身就走。

脑子里安静了三秒。

然后，不止一个声音。

一个清冷的女声接上了话。

"还算有几分血性。老厨子，这孩子比上回咱们看中的那个强点。"

"强个屁！买个菜都差点被人坑，换我当年的脾气，那摊子已经被我掀翻了！"

"你当年是御厨，谁敢坑你？脑袋不要了？"

"诶我说宋娘子，你一个教书先生，怎么也跑来凑热闹？"

"教书先生怎么了？我姜家的女儿让人当软柿子捏，我看不下去。"

姜池站住了。

菜市场门口，人来人往，热浪滚滚。

她捏着那把皱巴巴的零钱，慢慢抬起手，按住了自己的太阳穴。

里面，一堆声音还在吵。

"你们都别吵了，吓着孩子。"

"谁吓她了？我们这是给她撑腰！"

"你那是撑腰还是帮倒忙？刚才要不是我开口，她连肉都不会挑！"

"行了行了，都少说两句。丫头——"

一个听起来最苍老的声音打断了所有人。他说话很慢，但奇怪的是，他一开口，其他声音全安静了。

"别怕。我们是姜家历代先祖。你的血脉纯度高，远超这一辈任何一个人，所以你能听见我们。"

"换句话说，你是我们这一代选定的人。姜家第三百二十六代……。"

姜池张了张嘴，想说什么，一个字都说不出来。

那边苍老的声音还在继续，语气平淡得像在说今天天气不错。

"从今天起，你有任何委屈，任何不平，任何解决不了的事——找你祖宗。"

"咱们姜家祖祠里供着三百九十五位。上至战国，下至民国，三教九流，各行各业。"

"不管你是要打官司、做生意，还是要买房、捉奸、治小人——"

他顿了顿，语气里带了一丝不易察觉的骄傲。

"专业对口。"

姜池站在菜市场门口，左手拎菜，右手攥钱，耳边是亲妈在电话里越来越暴躁的催促。

"姜池！你死了吗？！你弟饿得胃疼了！"

她脑子里，一群死了几百年的祖宗正在开研讨会。

"谁有治胃疼的方子？先来一个。"

"饿的吃什么药？吃饭！"

"那小子多大了？二十了？还要姐姐做饭伺候？"

"搁我大宋，这年纪都能领兵了！"

"搁我大清，这年纪老婆都娶仨了。"

姜池忽然笑了一下。

她也不知道为什么笑。

可能是太离谱了。

可能是今天出门被热傻了。

也可能是因为——这是二十二年以来，第一次有人问她"什么感觉"，而不是"你弟怎么样了"。

她把手机举到嘴边，平静地说了一句。

"妈，我正在和三百九十五位祖宗开会。饭的事，等我开完会再说。"

然后挂了。

电话那头，姜母举着被挂断的手机，愣在原地。

客厅里，姜耀祖从房间里探出头，一脸不耐烦。

"妈，我姐回来没？饿死了！"

姜母回过神来，刚要骂姜池两句，手机又响了。

这回不是姜池。一串陌生号码。

她接起来，对面是个男人的声音，年轻，冷，像冬天里没关严的窗缝。

"姜伯母，我是顾时衍。后天登门拜访，请问姜池小姐在吗？"

姜母手一抖，手机差点掉地上。

顾时衍。

金陵顾家的顾时衍。

那个十年前订下的、所有人都以为早就黄了的婚约——

对方找上门了。

而此时，姜池正站在菜市场门口，听着脑子里三百九十五位祖宗的入职培训。

她不知道，有一个男人等了她二十二年。

她不知道，她太奶奶装疯的秘密，顾家欠下的命债，还有那道刻在祖祠封印上的残酷真相。

她只知道一件事。

从今天起，她不是一个人在战斗了。

她有一整个祖祠的——

祖宗。`,
  },
  {
    label: "第9章（白粥）",
    text: `# 第0001章 白粥

意识从黑暗中浮起来的时候，苏小满的第一个感觉是——饿。

胃壁往里缩，整个腹腔像被一只手攥住拧绞。她从没体验过这种饿——连酸水都挤不出一滴的空。她试图睁开眼睛，眼皮沉得像灌了铅，视野里一片模糊的暗，只有几缕惨白的月光从头顶的木板缝隙里漏下来。

稻草。

她闻到稻草的味道，混着泥土和霉斑的气息。脸侧有什么硬邦邦的东西硌着颧骨，她动了动手指，摸到一块粗糙的泥地。

不对。

她应该在自己租的那个小单间里，应该躺在床上，手机还压在枕头底下充电。她记得自己加班到凌晨两点，改完最后一份方案，脑袋往枕头上一倒——

然后呢？

然后就什么也不记得了。

胃又是一阵猛烈的痉挛，苏小满蜷起身子，干呕了几下，什么也没吐出来。胃里像被拧干了又拧了一遍，只剩一片火烧火燎的空。她趴在地上喘气，额头抵着冰凉的地面，脑子里乱得像一团被猫抓过的毛线。

记忆涌上来。

不是她的记忆。

是另一个人的——一个也叫苏小满的姑娘，十七岁，父母双亡，被堂叔苏大富和堂婶王氏占了宅子、吞了田产，关了柴房整整三天不给饭吃。那姑娘前天夜里发着高烧喊娘，昨天白天还在拍门求水，到了今天——

到了今天，那姑娘已经不在了。

苏小满猛地睁大眼睛。

她撑着地面想坐起来，手臂却软得像两根面条，撑到一半就塌了下去，肩膀砸在稻草堆里。她大口大口地喘气，心跳快得像要从嗓子眼里蹦出来。

不是做梦。

身上的疼痛是真的，胃里的饥饿是真的，这间又黑又臭的柴房是真的。

她穿越了。

穿到一个被关在柴房里活活饿死的倒霉姑娘身上。

"……我操。"

苏小满盯着头顶那条漏下月光来的木板缝，声音沙哑得几乎不成调。

这话要是说出去都没人信。她一个二本商务专业毕业、在公司干了两年牛马、连基金定投都没跑明白的普通女大学生，居然也能赶上穿越这种好事。

——好个屁。

她闭上眼，感受了一下这具身体的状态。四肢无力，头重脚轻，嘴唇干裂得每动一下都疼，胃里大概已经空了整整两天以上。照这个趋势下去，她和原主的结局不会有任何区别，都是死在这间柴房里。

唯一的不同可能是原主已经死了，而她还在这里等死。

就在这个念头划过脑海的瞬间，一道半透明的光幕毫无征兆地在她眼前展开。

光幕浮在黑暗中，像一个悬浮的屏幕，边缘泛着淡蓝色的微光。上面跳出一行字——

【检测到宿主濒死状态，是否绑定"跨时空外卖系统"？】

【绑定即送新人礼包：极品白粥一份。时效：10秒送达。】

苏小满愣了一下。

她盯着那行字看了足足五秒钟，然后无声地笑了——嘴角扯动干裂的嘴唇，渗出一丝血来。

好家伙，连穿越都带金手指的。

她抬起发软的手，在空中点了那个"是"。

光幕瞬间切换内容，新文字如流水般铺展开来：

【绑定成功。欢迎使用跨时空外卖系统。】

【新手教程：宿主可通过系统面板下单，商品将在10秒内送达指定位置。本系统使用专属金币结算，1金币=1文钱。当前余额：0金币。新人赠礼：极品白粥×1。另赠3级物品盲盒×3。】

【新人礼包已发放：极品白粥×1。是否现在领取？】

苏小满没有犹豫，再次点了确认。

——「是。」

光幕上的文字消失了，取而代之的是一个三、二、一的倒计时。她下意识地屏住呼吸，目光紧盯着面前的那片虚空。倒计时归零的瞬间，一阵温热的白气扑面而来。

一碗白粥，凭空出现在她面前的地面上。

白色的粗瓷碗，碗沿还带着一圈浅蓝色的釉。粥是刚刚出锅的温度，热气袅袅地升起来，在月光下勾勒出一团朦胧的白雾。粥粒已经熬得开了花，米油浮在表面，凝成一层薄薄的膜。

苏小满盯着这碗粥，眼眶突然就热了。

她颤抖着伸出手去捧那碗，指尖触到碗壁的瞬间，温热的触感沿着指腹传上来。她几乎是用尽全身力气才没把这碗粥打翻，双手捧着碗沿，低头凑上去。

第一口粥入喉的时候，她哭了。

没有声音，眼泪就这么砸进碗里，和温热的米汤混在一起。她一边哭一边吃，一口接一口，吃得又急又狼狈。米粒软烂，米汤浓稠，什么佐料都没有，就是一碗最普通的白粥。

半碗粥下去，胃里的绞痛终于平息了。暖意从胃部扩散开来，顺着血脉流向四肢，僵硬的手指暖过来，能动了。

苏小满把剩下的半碗粥喝完，舔了舔碗沿，放下碗，长长地呼出一口气。

活了。

她坐直身子，重新打量这间柴房。说是柴房，其实更像是杂物间——三四步见方的空间，堆着半人高的干柴和稻草，角落里立着几把锈蚀的农具。门是厚重的实木板，从外面上了闩，门缝里透进来一丝昏黄的灯光。

她侧耳听了一会儿，外面很安静，只有远处隐约传来几声犬吠。

苏小满低头看了看自己身上的衣服——粗布麻衣，打着补丁，袖口磨得发毛。她抬手摸了摸头发，乱成一团，手指穿过发丝的时候还打了好几个结。

行。情况很清晰了。

她，苏小满，二十一世纪商务专业毕业生，魂穿到了一个被亲戚霸占家产、关在柴房里等死的古代姑娘身上。

好消息是，她绑了个系统。

坏消息是，余额是零，送的三张3级物品盲盒还一张都没动过，也不知道够撑多久。

她正准备仔细研究一下系统面板，外面的灯光突然亮了一些——像是有人提着一盏灯走近了。

苏小满的动作僵住了。

脚步声从柴房外面传过来，一步一步，踩在碎石地面上，越来越近。不止一个人，至少两个。接着是一个男人的声音，压得不高不低，带着一股不耐烦：

"人还活着吗？"

另一个声音接话，女人的，尖细而刻薄："活着呢，饿几天又死不了。下午我还听见她拍门呢。"

"明儿一早赵婆子就来接人，你可别给我出岔子。"男人说，"人在就行，喂不喂水的无所谓，反正卖的是活人，不缺斤短两就行。"

女人笑了一声，那笑声在夜色里格外刺耳："你放心，关了三天的柴房都没死，一晚上还能出什么事？她爹娘死的时候把宅子田地都留给她又怎么样，到头来还不是从她手里过了一遍——"

"行了。"男人打断她，"少说两句。这事儿办完了就是办完了，别留话柄。"

脚步声开始远去，灯光也跟着暗下去。

苏小满坐在黑暗中，一动不动。

她听得很清楚。

堂叔——苏大富。堂婶——王氏。明天早上，来个人接她，送去春香楼。

妓院。

她攥紧了手下的稻草，指节发白。

苏小满从来不是什么脾气暴躁的人，她性格开朗，好说话，大学四年连和室友都没红过脸。但这口气，她咽不下去——为了那个已经死在这个柴房里的原主。

十七岁。父母双亡。被亲戚占了家产，关起来饿死，还要被卖到那种地方。

她的命就值这么点钱吗？

苏小满深呼吸了几次，强迫自己冷静下来。愤怒不能当饭吃——好吧，她已经吃了——愤怒不能解决问题。现在最重要的是活着，是逃出去。

她借着月光重新扫视柴房。

门是实木的，从外面闩上，推不开。墙壁是夯土，但靠里的那面墙一角有块松动的地方，隐约能看到外面透进来的光。通风口不大，成年人要爬出去有点勉强，但如果把那块地方挖大一些——

苏小满的目光落在角落里那几把锈蚀的农具上。

她撑着地面站起来。腿还是软的，但至少能撑住身体了。她挪到角落，蹲下身，挑了那把最小的短锄头——锄刃锈得厉害，但对付一堵夯土墙，够了。

她掂了掂锄头的重量，回头看了一眼紧闭的木门。

明早。

她还有一夜的时间。

苏小满握紧锄柄，嘴角扯出一个带着狠意的笑。

"苏大富，是吧。"她的声音低得只有自己能听见，"你等着。你侄女是饿死在这儿的——但这笔账，我替她记着。"

月光下，她扬起锄头，对准那块松动的墙角，狠狠砸了下去。`,
  },
];

export function EvaluatePage() {
  const text = useEvaluationStore(selectText);
  const phase = useEvaluationStore(selectPhase);
  const currentStep = useEvaluationStore(selectCurrentStep);
  const currentStepName = useEvaluationStore(selectCurrentStepName);
  const result = useEvaluationStore(selectResult);
  const errorMessage = useEvaluationStore(selectErrorMessage);
  const setText = useEvaluationStore(selectSetText);
  const handleRetry = useEvaluationStore(selectResetToIdle);
  const submitEvaluation = useEvaluationStore(selectSubmitEvaluation);
  const entries = useHistoryStore(selectEntries);
  const [pacedStep, setPacedStep] = useState(0);

  // Smooth step progression: pace fast steps at ~1/sec for visual continuity
  useEffect(() => {
    if (phase !== "evaluating") { setPacedStep(0); return; }
    // Step 5 (调用 AI 分析) — show immediately (real wait for AI)
    if (currentStep === 5) { setPacedStep(5); return; }
    // Pre-steps (negative) — show immediately
    if (currentStep < 0) { setPacedStep(currentStep); return; }
    // Steps 1-4, 6-7: pace at 1/sec toward the real step
    if (pacedStep < currentStep) {
      const t = setTimeout(() => setPacedStep((s) => s + 1), 1000);
      return () => clearTimeout(t);
    }
  }, [currentStep, phase, pacedStep]);

  const handleSubmit = useCallback(() => {
    submitEvaluation();
  }, [submitEvaluation]);

  if (phase === "evaluating") {
    return (
      <><div className="max-w-5xl mx-auto p-8 phase-fade-in">
        {currentStep === 0 ? (
          <div data-testid="skeleton" className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-6 w-6 rounded-full bg-border" />
                <div className="h-4 w-32 rounded bg-border" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border p-10 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-xl text-text mb-1">正在评估</h2>
            <p className="text-sm text-text-muted mb-7">AI 正在分析章节内容，请稍候</p>
            <ProgressBar currentStep={pacedStep} currentStepName={currentStepName} />
          </div>
        )}
      </div><style dangerouslySetInnerHTML={{__html:".phase-fade-in{animation:phaseFadeIn .25s ease-out}@keyframes phaseFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}"}} /></>);
  }

  if (phase === "done" && result) {
    return (
      <>
        <ReportCard
          report={result}
          onRetry={() => {
            handleRetry();
          }}
        />
        <div className="text-center pb-12">
          <button
            onClick={() => { handleRetry(); }}
            className="px-6 py-2 text-sm text-primary hover:text-primary-light transition-colors"
          >
            ← 重新评估
          </button>
        </div>
      </>
    );
  }

  if (phase === "error") {
    return <ErrorReport message={errorMessage} onRetry={handleRetry} />;
  }

  return (
    <><div className="max-w-5xl mx-auto p-8 phase-fade-in">
      {/* Title — above the columns so card top borders align */}
      <div className="mb-8">
        <h2 className="font-display text-2xl text-text mb-1">章节评估</h2>
        <p className="text-sm text-text-muted">粘贴章节文本以获取 AI 驱动的写作质量分析报告</p>
      </div>

      {/* Two-column layout: input + auxiliary cards */}
      <div className="flex gap-8 items-stretch">
        {/* Left column: input area */}
        <div className="flex-[2] min-w-0">
          {/* Input card */}
          <div className="bg-surface rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary-lighter focus-within:border-primary-light transition-all duration-200 h-full">
            <textarea
              placeholder="输入章节文本（至少1000字）..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full p-5 min-h-[380px] bg-transparent border-0 focus:outline-none focus:ring-0 text-base leading-relaxed text-text placeholder:text-text-muted resize-y"
            />

            {/* Status bar */}
            <div className="border-t border-border" />
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono tabular-nums text-sm text-text transition-colors duration-200"
                  data-testid="char-count"
                >
                  {text.length}
                </span>
                <span className="text-sm text-text-muted">字</span>
                {text.length > 0 && text.length < 1000 && (
                  <span className="text-xs text-text-muted ml-2">（至少 1,000 字）</span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={text.length < 1000}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.97]"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M3 1L12 7L3 13V1Z" fill="currentColor" />
                </svg>
                开始评估
              </button>
            </div>
          </div>
        </div>

        {/* Right column: 评估指南 + 写作小贴士 — top and bottom align with input card */}
        <div className="flex-[1] min-w-0 flex flex-col gap-5">
          <div className="flex-1 bg-surface rounded-lg border border-border p-5 flex flex-col">
            <h3 className="font-display text-sm text-text mb-3">评估指南</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                至少输入 1,000 字以获得准确分析
              </li>
              <li className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                建议粘贴完整的章节段落，而非片段
              </li>
              <li className="flex items-start gap-2 text-xs text-text-secondary">
                <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-primary/40" />
                避免纯对话或超短片段，上下文越丰富分析越准确
              </li>
            </ul>
          </div>

          <div className="flex-1 bg-surface rounded-lg border border-border p-5 flex flex-col">
            <h3 className="font-display text-sm text-text mb-3">写作小贴士</h3>
            <ul className="space-y-2">
              <li className="text-xs text-text-secondary leading-relaxed">
                黄金三章：开篇 3000 字决定读者去留，Hook 设计至关重要
              </li>
              <li className="text-xs text-text-secondary leading-relaxed">
                爽点节奏：每 500-800 字设置一个小爽点，保持读者追读欲望
              </li>
              <li className="text-xs text-text-secondary leading-relaxed">
                对话与描写的黄金比例建议保持在 3:7 左右
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick sample texts — below the cards, full width */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-xs text-text-muted shrink-0">快速试试：</span>
        {SAMPLE_TEXTS.map((sample) => (
          <button
            key={sample.label}
            onClick={() => setText(sample.text)}
            className="px-3 py-1 bg-primary-bg text-primary border border-primary-lighter rounded-md text-xs hover:bg-primary-lighter/30 transition-colors duration-200"
          >
            {sample.label}
          </button>
        ))}
      </div>

      {/* 历史评估 — 全宽，在双栏下方 */}
      <div className="mt-10 pt-8 border-t border-border">
        <div className="flex items-baseline gap-2 mb-5">
          <h3 className="font-display text-lg text-text">历史评估</h3>
          {entries.length > 0 && (
            <span className="text-xs text-text-muted font-mono">最近 {entries.length} 条</span>
          )}
        </div>
        <EvaluationHistory
          onSelect={(entry) => {
            if (entry.fullReport) {
              useEvaluationStore.setState({ result: entry.fullReport, phase: "done" });
            }
          }}
        />
      </div>
    </div>
      <style dangerouslySetInnerHTML={{__html:
        ".phase-fade-in{animation:phaseFadeIn .25s ease-out}" +
        "@keyframes phaseFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}"}}
      /></>);
}
