-- Sugestão de dados iniciais com os mesmos nomes do modo simulado do front.
-- Senha das contas: 123456 (PDF, Revisão 3.0). Ajuste se o back-end guardar hash.

INSERT INTO usuarios (nome, email, senha, perfil) VALUES
('Renata Figueiredo',    'renata.figueiredo@teste.com', '123456', 'ADMIN'),
('TechNova Eletrônicos', 'technova@teste.com',          '123456', 'LOJISTA'),
('Arena Gamer',          'arenagamer@teste.com',        '123456', 'LOJISTA'),
('Ana Beatriz Souza',    'ana.souza@teste.com',         '123456', 'CLIENTE'),
('Carlos Eduardo Lima',  'carlos.lima@teste.com',       '123456', 'CLIENTE');

INSERT INTO produtos (lojista_id, nome, descricao, preco, estoque, imagem, ativo) VALUES
((SELECT id FROM usuarios WHERE email='technova@teste.com'),   'Smartphone 5G Pro 256 GB',
  'Tela de 6,7 polegadas, câmera tripla e bateria para o dia todo.',       2499.00,  8, NULL, TRUE),
((SELECT id FROM usuarios WHERE email='technova@teste.com'),   'Notebook Ultra 14',
  'Notebook leve de 14 polegadas, 16 GB de memória e SSD de 512 GB.',      4299.00,  5, NULL, TRUE),
((SELECT id FROM usuarios WHERE email='arenagamer@teste.com'), 'Headset Gamer Surround 7.1',
  'Som envolvente, microfone removível e almofadas macias.',                799.90, 15, NULL, TRUE),
((SELECT id FROM usuarios WHERE email='arenagamer@teste.com'), 'Teclado Mecânico RGB',
  'Switches mecânicos, iluminação RGB e layout ABNT2.',                     219.90,  0, NULL, TRUE);
