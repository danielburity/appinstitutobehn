import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle } from "lucide-react";

interface TermsModalProps {
  type: "affiliate" | "course";
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

// ─── TERMS CONTENT ───

const AFFILIATE_TERMS = `CONTRATO DE ASSOCIAÇÃO AO INSTITUTO BEHN DE HIPNOSE

Pelo presente instrumento particular, de um lado o INSTITUTO BEHN DE HIPNOSE E PNL LTDA, inscrito no cnpj sob o n. 49.177.308/0001-04, com sede na R Tte Gomes Ribeiro, 182, cj 124, CEP: 04.038-040, doravante denominado simplesmente INSTITUTO, e de outro lado, a pessoa física ou jurídica qualificada no formulário de associação, doravante denominada simplesmente AFILIADO, têm entre si justas e acordadas as seguintes cláusulas:

OBJETO:
O presente contrato tem como objeto a associação do AFILIADO ao INSTITUTO BEHN DE HIPNOSE, em forma de anuidade, que permitirá ao AFILIADO o acesso à plataforma online do Instituto com aulas gravadas, aulas ao vivo semanais e descontos em cursos e estabelecimentos parceiros.

DIREITOS DO AFILIADO:
O AFILIADO terá os seguintes direitos:
a) Acesso à plataforma online do Instituto, contendo aulas gravadas e materiais didáticos;
b) Participação em aulas ao vivo semanais, com a possibilidade de interação com o professor;
c) Descontos em cursos e estabelecimentos parceiros, a serem informados pelo Instituto.

DEVERES DO AFILIADO:
O AFILIADO deverá cumprir os seguintes deveres:
a) A afiliação trata-se de anuidade que poderá ser parcelada em até 12x, valor este que será pago ao Instituto, mediante cartão de crédito cadastrado em plataforma;
b) Eventual cancelamento do cartão deverá ser informado imediatamente a este Instituto, para que possa substituir a forma de pagamento em nossa plataforma online;
c) Utilizar os materiais e conteúdos disponibilizados pela plataforma online do Instituto somente para fins de estudo e desenvolvimento pessoal e profissional, comprometendo-se a não divulgá-los a terceiros ou utilizá-los para fins comerciais ou de ensino;
d) Não compartilhar a senha de acesso à plataforma online do Instituto com terceiros, sob pena de suspensão ou cancelamento da associação;
e) Respeitar as normas e regras estabelecidas pelo Instituto, incluindo o código de ética e conduta, e pelos demais associados;
f) Manter em sigilo todas as informações e conteúdos a que tiver acesso em razão da associação, comprometendo-se a não divulgá-los ou utilizá-los para fins distintos dos previstos neste contrato, sob pena de responsabilidade civil e criminal.

VIGÊNCIA:
O presente contrato terá vigência de 1 (um) ano, contado a partir da data da efetivação da associação, sendo automaticamente renovado por igual período, salvo pré-aviso de 30 dias para que a renovação não ocorra.

RESCISÃO:
Tratando-se de aquisição de anuidade, ainda que parcelada, não haverá rescisão contratual anterior ao período de 1 (um) ano, posto que entregue diversos conteúdos gravados e material de apoio e afiliação, logo no primeiro mês. Considerando que a renovação se dará de maneira automática, poderá o AFILIADO pré-avisar 30 dias antes da renovação, para que esta não aconteça.

Da Política de Arrependimento e Reembolso:
Em conformidade com o Artigo 49 do Código de Defesa do Consumidor, o Usuário tem o direito de solicitar o cancelamento e reembolso integral do valor pago no prazo máximo de 7 (sete) dias corridos, contados a partir da data de aprovação da compra.
Após o prazo de 7 dias, cancelamentos de assinaturas apenas interrompem a renovação do próximo ciclo, não gerando direito a reembolso de valores retroativos ou meses parcialmente utilizados.

Sobre a Vitrine de Terapeutas:
O Instituto Behn fornece a aba "Terapeutas" apenas como um facilitador de conexões.
O Instituto não se responsabiliza pelos atendimentos clínicos, preços cobrados, agendamentos ou acordos feitos diretamente entre o cliente e o terapeuta listado no aplicativo. A responsabilidade civil e profissional é exclusivamente do terapeuta contratado.

LIMITAÇÃO DE RESPONSABILIDADE:
O INSTITUTO não se responsabiliza por quaisquer atos praticados pelo AFILIADO em decorrência da utilização dos materiais e conteúdos disponibilizados pela plataforma online, nem por eventuais prejuízos financeiros, materiais ou pessoais sofridos pelo AFILIADO.

Propriedade Intelectual e Direitos Autorais:
Todo o conteúdo da plataforma (vídeos, e-books, metodologias e design) é de propriedade exclusiva do Instituto Behn. É terminantemente proibido o compartilhamento de senhas, download de vídeos, cópia, revenda ou pirataria do material, sob pena de bloqueio imediato da conta sem direito a reembolso, além de responder judicialmente pelas perdas e danos causados.
O AFILIADO se compromete a manter em sigilo as informações confidenciais do INSTITUTO, obtidas em razão da associação, comprometendo-se a não divulgá-las ou utilizá-las para fins distintos dos previstos neste contrato.

DISPOSIÇÕES GERAIS:
a) Qualquer alteração neste contrato somente terá validade se realizada por escrito e assinada por ambas as partes;
b) A tolerância ou omissão de qualquer das partes em exigir o cumprimento de quaisquer obrigações assumidas neste contrato não será considerada como novação ou renúncia a qualquer direito, constituindo-se em mera liberalidade;
c) As partes elegem o Foro da Comarca de São Paulo para dirimir quaisquer controvérsias oriundas deste contrato, renunciando a qualquer outro, por mais privilegiado que seja.

E, por estarem assim justas e acordadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas.

INSTITUTO BEHN DE HIPNOSE`;

const COURSE_TERMS = `Termos de Uso e Contrato de Assinatura - Instituto Behn

Este documento estabelece os termos e condições para a utilização da plataforma digital, cursos e vitrine de terapeutas do Instituto Behn (doravante denominado "APP Instituto Behn"). Ao se cadastrar ou adquirir qualquer plano ou curso, o Usuário concorda integralmente com as regras abaixo descritas.

1. Do Objeto

1.1. O presente contrato tem como objeto a concessão de licença de uso, em caráter pessoal e intransferível, para acesso aos conteúdos em vídeo, áudio, textos, materiais de apoio e eventos ao vivo oferecidos pelo Instituto Behn.
1.2. A Plataforma também oferece uma área de "Terapeutas", que funciona como uma vitrine para conectar alunos formados ou em formação a possíveis clientes.

2. Dos Planos, Valores e Pagamentos

2.1. O acesso à plataforma pode se dar através de compras de Cursos Avulsos ou de Assinaturas (Recorrentes).
2.2. Os valores, prazos de duração (ex: mensal, anual) e benefícios de cada plano serão aqueles anunciados de forma clara na página de checkout no momento da contratação.
2.3. Formas de Pagamento: Os pagamentos são processados via Pagar.me e poderão ser realizados por:
  • Cartão de Crédito (à vista ou parcelado, conforme opções exibidas no checkout);
  • PIX (à vista);
  • Crédito como pagamento recorrente.

3. Da Inadimplência, Cancelamento e Suspensão de Acesso

3.1. Em caso de assinaturas recorrentes, a renovação é automática. Caso a cobrança no cartão de crédito falhe ou o PIX/Crédito de renovação não seja pago, o sistema considerará o usuário como inadimplente.
3.2. Bloqueio Automático: Constatada a falta de pagamento ou o cancelamento da assinatura por parte do usuário, a plataforma revogará automaticamente o acesso do Usuário a todos os conteúdos exclusivos, aulas e eventos.
3.3. Remoção da Vitrine: Caso o usuário inadimplente ou cancelado seja um Terapeuta listado na plataforma, o seu perfil será ocultado instantaneamente da aba de busca de Terapeutas até que a situação financeira seja regularizada.

4. Da Política de Arrependimento e Reembolso

4.1. Em conformidade com o Artigo 49 do Código de Defesa do Consumidor, o Usuário tem o direito de solicitar o cancelamento e reembolso integral do valor pago no prazo máximo de 7 (sete) dias corridos, contados a partir da data de aprovação da compra.
4.2. Após o prazo de 7 dias, cancelamentos de assinaturas apenas interrompem a renovação do próximo ciclo, não gerando direito a reembolso de valores retroativos ou meses parcialmente utilizados.

5. Propriedade Intelectual e Direitos Autorais

5.1. Todo o conteúdo da plataforma (vídeos, e-books, metodologias e design) é de propriedade exclusiva do Instituto Behn.
5.2. É terminantemente proibido o compartilhamento de senhas, download de vídeos, cópia, revenda ou pirataria do material, sob pena de bloqueio imediato da conta sem direito a reembolso, além de responder judicialmente pelas perdas e danos causados.

6. Sobre a Vitrine de Terapeutas

6.1. O Instituto Behn fornece a aba "Terapeutas" apenas como um facilitador de conexões.
6.2. O Instituto não se responsabiliza pelos atendimentos clínicos, preços cobrados, agendamentos ou acordos feitos diretamente entre o cliente e o terapeuta listado no aplicativo. A responsabilidade civil e profissional é exclusivamente do terapeuta contratado.

7. Disposições Gerais

7.1. O Instituto Behn reserva-se o direito de atualizar estes termos e o conteúdo programático dos cursos a qualquer momento, visando sempre a melhoria da plataforma.
7.2. Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato.

Instituto Behn de Hipnose e Terapia`;

export function TermsModal({ type, accepted, onAcceptChange }: TermsModalProps) {
  const [open, setOpen] = useState(false);

  const termsContent = type === "affiliate" ? AFFILIATE_TERMS : COURSE_TERMS;
  const termsTitle =
    type === "affiliate"
      ? "Contrato de Associação — Instituto Behn"
      : "Termos de Uso e Contrato — Instituto Behn";

  return (
    <div className="space-y-3">
      {/* Checkbox + Link */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border-2 border-border/50 bg-muted/30 transition-all hover:border-primary/20">
        <Checkbox
          id="accept-terms"
          checked={accepted}
          onCheckedChange={(checked) => onAcceptChange(checked === true)}
          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer select-none">
          Li e aceito os{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
            className="text-primary font-bold underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {type === "affiliate" ? "Termos do Contrato de Associação" : "Termos de Uso e Contrato"}
          </button>{" "}
          do Instituto Behn de Hipnose e PNL.
        </Label>
      </div>

      {/* Not accepted warning */}
      {!accepted && (
        <p className="text-[11px] text-destructive/70 font-bold px-1 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          É obrigatório aceitar os termos para prosseguir.
        </p>
      )}

      {/* Modal/Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] p-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground leading-tight">
                {termsTitle}
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[55vh] px-6 py-4">
            <div className="prose prose-sm max-w-none text-foreground/80">
              {termsContent.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={i} />;

                // Detect section headers (all-caps or numbered sections)
                const isHeader =
                  /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{6,}:?$/.test(trimmed) ||
                  /^\d+\.\s/.test(trimmed) ||
                  trimmed.startsWith("OBJETO") ||
                  trimmed.startsWith("DIREITOS") ||
                  trimmed.startsWith("DEVERES") ||
                  trimmed.startsWith("VIGÊNCIA") ||
                  trimmed.startsWith("RESCISÃO") ||
                  trimmed.startsWith("LIMITAÇÃO") ||
                  trimmed.startsWith("DISPOSIÇÕES");

                if (isHeader) {
                  return (
                    <h4 key={i} className="font-bold text-foreground mt-4 mb-1 text-sm uppercase tracking-wide">
                      {trimmed}
                    </h4>
                  );
                }

                // List items
                if (/^[a-f]\)/.test(trimmed) || trimmed.startsWith("•")) {
                  return (
                    <p key={i} className="pl-4 text-sm leading-relaxed text-muted-foreground mb-1">
                      {trimmed}
                    </p>
                  );
                }

                return (
                  <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-2">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Fechar
            </Button>
            <Button
              className="flex-1 gradient-primary text-white font-bold gap-2"
              onClick={() => {
                onAcceptChange(true);
                setOpen(false);
              }}
            >
              <CheckCircle className="w-4 h-4" />
              Li e Aceito
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
