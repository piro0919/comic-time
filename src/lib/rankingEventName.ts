/**
 * ランキングの元になるイベントの名前。
 *
 * 送るのは作品カード、読むのは集計側で、片方はクライアント、
 * もう片方はファイルを読むサーバー側になる。名前だけをここに置いて、
 * カードが集計の処理ごと抱え込まないようにする。
 */
const rankingEventName = "work-open";

export default rankingEventName;
